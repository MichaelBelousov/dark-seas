
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

const origin = new V2();
const posXAxis = new V2(1, 0);

const boatBit =     0b001
const rutterBit =   0b010
const boomBit =     0b100

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

    this.mousePos = {x:0, y:0};

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
    // TODO: spawn as awake so forces don't have to waken it!
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
        density: 4.0,
        friction: 0.5,
        filterMaskBits: ~(boomBit | rutterBit),
        filterCategoryBits: boatBit
      }
    );
    this.rutterBody = world.createDynamicBody(pl.Vec2(0, -1.7));
    this.rutterBody.createFixture(pl.Polygon([
      [-0.2,  0.0],
      [-0.2, -2.0],
      [ 0.2, -2.0],
      [ 0.2,  0.0],
    ].map(a => pl.Vec2(...a))), {
      density: 1.0,
      filterMaskBits: ~(boomBit | boatBit),
      filterCategoryBits: rutterBit
    });
    this.boomBody = world.createDynamicBody(pl.Vec2(0, 0));
    this.boomBody.createFixture(pl.Polygon([
        [-0.2, 0],
        [-0.2, -4.0],
        [0.2, -4.0],
        [0.2, 0],
      ].map(a => pl.Vec2(...a))),
      {
        density: 1.0,
        filterMaskBits: ~(rutterBit | boatBit),
        filterCategoryBits: boomBit,
      }
    );
    world.createJoint(pl.RevoluteJoint({
      enableLimit: true,
      lowerAngle: -Math.PI/3,
      upperAngle: Math.PI/3,
    }, this.boatBody, this.rutterBody, pl.Vec2(0, -2.0)));
    world.createJoint(pl.RevoluteJoint({}, this.boatBody, this.boomBody, pl.Vec2(0, 0)));
    document.addEventListener('mousemove', e => {
      e.preventDefault();
      this.mousePos.x = e.x;
      this.mousePos.y = e.y;
    });
    document.addEventListener('keydown', e => {
      e.preventDefault();
      const rutterControlImpulse = 1;
      switch (e.key) {
        case 'a':
          this.rutterBody.applyAngularImpulse(rutterControlImpulse);
          break;
        case 'd':
          this.rutterBody.applyAngularImpulse(-rutterControlImpulse);
          break;
      }
    });
  }

  tickPhysics(ctx, delta) {
    if (!this.root) return;

    const boatDir = posXAxis.im.rotateAround(origin, this.boatBody.getAngle());

    // as the boat moves through water, the rutter is "hit" by
    // water which imposes a force, we use the dot product to
    // determine the "surface area" of the rutter which multiplies
    // the force
    // we take the absolute value of the dot product since the
    // force direction doesn't invert when the side of the rutter does
    //const rutterArea = Math.abs(waterRelativeV.dot(tillerNorm));

    //const rutterPush = waterRelativeV.clone().setLength(rutterArea);

    const boomNorm = posXAxis.im.rotateAround(origin, this.boomBody.getAngle());
    const windMagnitude = ctx.state.wind.velocity.dot(boomNorm);
    // this should be fought by drag from the keel
    //const windPush=reflectedVec(ctx.state.wind.velocity,boomNorm).negate();
    const windPush = boatDir.multiplyScalar(windMagnitude);
    //drawArrow

    this.boomBody.applyForceToCenter(pl.Vec2(...windPush), true);


    //this.root.position.set(...newPosition, 0);
  } 

  tick(ctx, delta = 0) {
    this.ctx = ctx;
    this.uniforms.time.value += delta;
    this.tickPhysics(ctx, delta);
    //this.root.rotation = this.boatBody.getAngle();
    //this.root.position = new V2(...this.boatBody.getAngle());
    const boatPos = this.boatBody.getPosition();
    ctx.testbed.x = boatPos.x;
    ctx.testbed.y = boatPos.y;

    const mid = { x: window.innerWidth/2, y: window.innerHeight/2 };
    this.ctx.testbed.drawPoint(this.mousePos.x, this.mousePos.y);
    // when using three.js camera, will unproject from camera transform:
    // new V3(mouse.x, mouse.y, -1).unproject(camera)
    const nextBoomDir = new V2(this.mousePos.x-mid.x, -(this.mousePos.y-mid.y));
    nextBoomDir.rotateAround(origin, Math.PI/2);
    this.boomBody.setTransform(this.boomBody.getPosition(), nextBoomDir.angle());
  }
};

export default Boat;

