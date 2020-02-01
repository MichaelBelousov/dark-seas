
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/loaders/DRACOLoader.js";
import {
  drawArrow,
  rotateVecZ,
  smoothClampCurve,
  reflectedVec
} from "../../util.js";

const ogDrawArrow = drawArrow;

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
        this.root = gltf.scene;
        ctx.scene.add(this.root);
        this.root.scale.multiplyScalar(0.2);
      },
      console.log,
      err => {
        console.error('ERROR:', err);
      }
    );
    this.uniforms = {
      time: { value: 0 },
      lightPos: { value: new THREE.Vector2(0.0, 0.0) },
      lightIntensity: { value: 2.0 },
      lightRadius: { value: 0.6 },
      fogDensity: { value: 0.2 },
      fogColor: { value: new THREE.Vector3(0, 0, 0) },
      uvScale: { value: new THREE.Vector2(1.0, 1.0) },
    };
  }

  drawPhysicsState(ctx, delta) {
    const { state } = ctx;
    //const drawArrow = (opts) =>
      //ogDrawArrow({ ...opts, scene: ctx.scene });
    drawArrow({
      arrow: state.boat.orientation,
      handle: "boatDir",
      scene: ctx.scene,
      color: "#ff0000"
    });
    drawArrow({
      arrow: state.boat.boom.orientation,
      handle: "boomDir",
      scene: ctx.scene,
      color: "#ffff00"
    });
    drawArrow({
      arrow: state.boat.tiller.orientation,
      handle: "tiller",
      scene: ctx.scene,
      color: "#0000ff"
    });
    drawArrow({
      arrow: state.wind.velocity,
      handle: "wind",
      scene: ctx.scene,
    });
    drawArrow({
      arrow: state.sea.velocity,
      handle: "sea",
      scene: ctx.scene,
    });
  }

  tickPhysics(ctx, delta) {
    this.drawPhysicsState(ctx, delta);

    if (!this.root) return;

    ctx.state.boat.position = this.root.position;

    const {
      wind: { velocity: windV },
      sea: { velocity: seaV },
      boat: {
        orientation: boatDir,
        boom: {
          orientation: boomDir,
        },
        position,
        velocity,
        mass: boatMass,
        tiller: {
          mass: tillerMass
        },
      },
      input: {
        tillerFromLeftPercent: tillerInput,
      }
    } = ctx.state;

    // XXX: boomDir must be normalized
    const boomNorm = rotateVecZ(boomDir, Math.PI/2);

    const windPush = reflectedVec(windV, boomNorm).negate();

    const tillerMaxTurnAngle = Math.PI/3;
    const negBoatDir = boatDir.clone().negate();

    const tillerDir = rotateVecZ(
      boatDir,
      (tillerInput - 0.5) * tillerMaxTurnAngle
    ).negate();
    drawArrow({
      arrow: tillerDir,
      handle: "tillerDir",
      scene: ctx.scene,
    });
    const isTillerLeft = tillerInput < 0.5;
    const tillerNorm = isTillerLeft
      ? rotateVecZ(tillerDir, Math.PI/2)
      : rotateVecZ(tillerDir, -Math.PI/2);

    const waterRelativeVelocity = seaV.clone().sub(velocity);

    // TODO: need to reflect normal?
    const tillerPush = reflectedVec(waterRelativeVelocity, tillerNorm);

    const acceleration = (
      windPush.clone().divideScalar(boatMass)
      .add(tillerPush.divideScalar(tillerMass))
    );

    // simulate drag with smoothing and clamping
    const rawNextVelocity = (
      velocity.clone().add(
        acceleration.clone().multiplyScalar(delta)
      )
    );
    rawNextVelocity.clampLength(-5, 5);
    //const smoothedNextVelocity = smoothClampCurve(rawNextVelocity, maxVelocity);
    ctx.state.boat.velocity.set(...rawNextVelocity);

    const newPosition = (
      position.clone().add(
        new THREE.Vector3(...rawNextVelocity, 0).multiplyScalar(delta)
      )
    );

    const { x, y } = newPosition;
    this.root.position.set(x, y, 0);
  } 

  tick(ctx, delta = 0) {
    //this.root.rotation.x += delta * 0.5;
    this.uniforms.time.value += delta;
    this.tickPhysics(ctx, delta);
  }
};

export default Boat;

