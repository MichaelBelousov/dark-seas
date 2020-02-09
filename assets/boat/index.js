
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/loaders/DRACOLoader.js";
import {
  drawArrow,
  rotateVecZ,
  smoothClampCurve,
  reflectedVec
} from "../../util.js";
import "https://cdn.jsdelivr.net/npm/planck-js@0.2/dist/planck-with-testbed.js";
const pl = window.planck;

const V3 = THREE.Vector3;
const V2 = THREE.Vector2;

const deltaFac = 1;

// TODO: move to monkeypatch module
// HACK: add magic iteratability to THREE.Vectors
THREE.Vector3.prototype[Symbol.iterator] = function* iterVec3 (v) {
  if (!v) v = this;
  yield v.x;
  yield v.y;
  yield v.z;
}

THREE.Vector2.prototype[Symbol.iterator] = function* iterVec2 (v) {
  if (!v) v = this;
  yield v.x;
  yield v.y;
}

Object.defineProperty(THREE.Vector3.prototype, "im", {
  get () { return this.clone(); }
});

Object.defineProperty(THREE.Vector2.prototype, "im", {
  get () { return this.clone(); }
});

const resolve = path => './assets/boat/' + path;

let resources = {
  vertShader:  {
    value: undefined,
    loaded: false,
    path: resolve('vert.glsl'),
  },
  fragShader: {
    value: undefined,
    loaded: false,
    path: resolve('frag.glsl'),
  },
  model: {
    loaded: true, // HACK
    path: resolve('boat.gltf'),
  }
};


// basic actor setup
class Boat {
  static async load() {
    await Promise.all(Object.values(resources).map(async r => {
      if (!r.loaded) {
        const resp = await fetch(r.path);
        r.value = await resp.text();
        r.loaded = true;
      }
    }));
  }

  constructor (ctx) {
    //TODO: move loader to shared ctx
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('libs/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const result = gltfLoader.load(resources.model.path,
      gltf => {
        //this.root = gltf.scene;
        //ctx.scene.add(this.root);
        //this.root.scale.multiplyScalar(0.2);
        this.root = { position: new V3() }
      },
      console.log,
      err => {
        console.error('ERROR:', err);
      }
    );
    this.uniforms = {
      time: { value: 0 },
      lightPos: { value: new V2(0.0, 0.0) },
      lightIntensity: { value: 2.0 },
      lightRadius: { value: 0.6 },
      fogDensity: { value: 0.2 },
      fogColor: { value: new V3(0, 0, 0) },
      uvScale: { value: new V2(1.0, 1.0) },
    };
  }

  spawnPhysics(world) {
    this.boatBody = world.createDynamicBody(pl.Vec2(0, 0));
    this.boatBody.createFixture(pl.Polygon([
        [-0.5, -1.4],
        [-0.7,  0.6],
        [-0.5,  0.9],
        [-0.2,  1.2],
        [ 0.0,  1.4],
        [ 0.2,  1.2],
        [ 0.5,  0.9],
        [ 0.7,  0.6],
        [ 0.5, -1.4],
        // TODO: apply that scaling there to source points
      ].map(a => pl.Vec2(...a.map(x=>2*x)))),
      { 
        density: 1.0,
        friction: 0.5,
      }
    );
    this.rutterBody = world.createDynamicBody(pl.Vec2(0, -1.7));
    this.rutterBody.createFixture(pl.Polygon([
      [-0.2,  0.0],
      [-0.2, -2.0],
      [ 0.2, -2.0],
      [ 0.2,  0.0],
    ].map(a => pl.Vec2(...a))), {
      density: 1.0
    });
    this.boomBody = world.createDynamicBody(pl.Vec2(0, 0));
    this.boomBody.createFixture(pl.Polygon([
        [-0.2, 0],
        [-0.2, -4.0],
        [0.2, -4.0],
        [0.2, 0],
      ].map(a => pl.Vec2(...a))),
      { density: 1.0, }
    );
    world.createJoint(pl.RevoluteJoint({}, this.boatBody, this.rutterBody, pl.Vec2(0, -2.0)));
    world.createJoint(pl.RevoluteJoint({}, this.boatBody, this.boomBody, pl.Vec2(0, 0)));
  }

  drawPhysicsState(ctx, delta) {
    const { state } = ctx;
    drawArrow({
      from: state.boat.position,
      arrow: state.boat.orientation,
      handle: "boatDir",
      scene: ctx.scene,
      color: "#ff0000"
    });
    drawArrow({
      from: state.boat.position,
      arrow: state.boat.boom.orientation,
      handle: "boomDir",
      scene: ctx.scene,
      color: "#ffff00"
    });
    drawArrow({
      from: state.boat.position,
      arrow: state.wind.velocity,
      handle: "wind",
      scene: ctx.scene,
    });
    drawArrow({
      from: state.boat.position,
      arrow: state.sea.velocity,
      handle: "sea",
      scene: ctx.scene,
    });
    drawArrow({
      from: state.boat.position,
      arrow: state.boat.velocity,
      handle: "boatVelocity",
      scene: ctx.scene,
      color: '#0000ff',
    });
  }

  tickPhysics(ctx, delta) {
    this.drawPhysicsState(ctx, delta);

    if (!this.root) return;

    ctx.state.boat.position = this.root.position;

    let {
      wind: { velocity: windV },
      sea: { velocity: seaV },
      boat: {
        orientation: boatDir,
        boom: {
          orientation: boomDir,
        },
        position,
        velocity,
        rutter,
        ...boat
      },
      input: {
        tillerFromLeftPercent: tillerInput,
      }
    } = ctx.state;

    const tillerMaxTurnAngle = Math.PI/3;
    const negBoatDir = boatDir.clone().negate();

    const tillerDir = rotateVecZ(
      boatDir,
      (tillerInput - 0.5) * tillerMaxTurnAngle
    ).negate();
    drawArrow({
      from: position,
      arrow: tillerDir,
      handle: "tillerDir",
      scene: ctx.scene,
    });

    //pick the normal that the sea velocity hits
    const tillerNorm = rotateVecZ(tillerDir, Math.PI/2);
    if (tillerNorm.dot(seaV) < 0)
      tillerNorm.negate();

    drawArrow({
      from: position,
      arrow: tillerNorm,
      handle: "tillerNorm",
      scene: ctx.scene,
    });

    // velocity of the water relative to the boat
    const waterRelativeV = seaV.clone().sub(velocity);
    drawArrow({
      from: position,
      arrow: waterRelativeV,
      handle: "waterRelativeV",
      scene: ctx.scene,
    });

    // as the boat moves through water, the rutter is "hit" by
    // water which imposes a force, we use the dot product to
    // determine the "surface area" of the rutter which multiplies
    // the force
    // we take the absolute value of the dot product since the
    // force direction doesn't invert when the side of the rutter does
    const rutterArea = Math.abs(waterRelativeV.dot(tillerNorm));

    const rutterPush = waterRelativeV.clone().setLength(rutterArea);
    drawArrow({
      from: position,
      arrow: rutterPush,
      handle: "rutterPush",
      scene: ctx.scene,
      color: '#ffffff',
    });

    this.rutterBody.applyForceToCenter(pl.Vec2(...rutterPush));

    //this.rutterBody.applyForceToCenter

    const rutterDistanceFromBoatCenterOfMass = 3; //meters

    // using solid cylinder moment of inertia
    const boatInertiaMoment = (
      (boat.mass*boat.hull.depth**2)/4
      + (boat.mass*boat.hull.length**2)/12
    );

    const boatRutterRadius =
      boatDir.clone().negate().setLength(boat.hull.length/2);

    const rutterTorque = (
      new V3(...boatRutterRadius, 0).cross(new V3(...rutterPush, 0))
    );

    // rutterTorque is netTorque
    const angularAcceleration = rutterTorque.divideScalar(boatInertiaMoment);

    // TODO: need to use proper angular velocity perhaps
    boat.rotation += angularAcceleration.length() * delta * deltaFac;

    const boomNorm = rotateVecZ(boomDir, Math.PI/2);
    drawArrow({
      from: position,
      arrow: boomNorm,
      handle: "boomNorm",
      scene: ctx.scene,
      color: "#ff00af"
    });

    const windPush = reflectedVec(windV, boomNorm).negate();
    drawArrow({
      from: position,
      arrow: windPush,
      handle: "windPush",
      scene: ctx.scene,
      color: "#ff00ff"
    });
    // TODO: use a dot product factor on the force on the boat
    // to simulate the push area of the keel

    const linearAcceleration = windPush.im.divideScalar(boat.mass);

    // simulate drag with smoothing or clamping or force?
    let dragForce;

    const rawNextVelocity = (
      velocity.clone().add(
        linearAcceleration.clone().multiplyScalar(delta*deltaFac)
      )
    ).clampLength(-5, 5);

    //const smoothedNextVelocity = smoothClampCurve(rawNextVelocity, maxVelocity);
    ctx.state.boat.velocity.set(...rawNextVelocity);

    const newPosition = (
      position.clone().add(
        new V3(...rawNextVelocity, 0)
          .multiplyScalar(delta*deltaFac)
      )
    );

    this.root.position.set(...newPosition, 0);
  } 

  tick(ctx, delta = 0) {
    //this.root.rotation.x += delta * 0.5;
    this.uniforms.time.value += delta;
    this.tickPhysics(ctx, delta);
  }
};

export default Boat;

