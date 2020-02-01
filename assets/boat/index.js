
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/loaders/DRACOLoader.js";
import {
  drawArrow,
  rotateVecZ,
  smoothClampCurve,
  reflectedVec
} from "../../util.js";


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
  }

  tickPhysics(ctx, delta) {
    this.drawPhysicsState(ctx, delta);

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
        mass
      },
      input: {
        tillerFromLeftPercent: tillerInput,
      }
    } = ctx.state;

    // XXX: boomDir must be normalized
    const boomNorm = rotateVecZ(boomDir, Math.PI/4);

    const windPush = -reflectedVec(windV, boomNorm);

    const tillerMinAngle = -Math.PI/3;
    const tillerMaxAngle = Math.PI/3;
    const tillerMin = rotateVecZ(boatDir.multiplyScalar(-1), tillerMinAngle);
    const tillerMax = rotateVecZ(boatDir.multiplyScalar(-1), tillerMaxAngle);
    const tillerDir = tillerMin.multiplyScalar(tillerInput) + tillerMax.multiplyScalar();
    const tillerNorm = rotateVecZ(tillerMin.multiplyScalar(tillerInput) + tillerMax.multiplyScalar());

    const waterRelativeVelocity = seaV - velocity;

    // TODO: need to reflect normal?
    const tillerPush = reflectedVec(waterRelativeVelocity, tillerNorm);

    const boatMassProportion = 0.9;
    const boatMass = boatMassProportion * mass;
    const tillerMass = (1 - boatMassProportion) * mass;

    const acceleration = windPush/boatMass + tillerPush/tillerMass;

    // simulate drag with smoothing and clamping
    const maxVelocity = 5;
    const rawNextVelocity = velocity + acceleration * delta;
    const smoothedNextVelocity = smoothClampCurve(rawNextVelocity, maxVelocity);

    ctx.state.boat.velocity = smoothedNextVelocity;
    const newPosition = position + smoothedNextVelocity * delta;

    this.root.position = newPosition;
  } 

  tick(ctx, delta = 0) {
    //this.root.rotation.x += delta * 0.5;
    this.uniforms.time.value += delta;
    this.tickPhysics(ctx, delta);
  }
};

export default Boat;

