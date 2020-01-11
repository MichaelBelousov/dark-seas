
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/loaders/DRACOLoader.js";

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

// TODO: move to math util module

// smoothly cap a curve with a maximum upper bound
const smoothClampCurve = (value, max) => {
  //not sure why 4 seems to give it a linear proportion, should do the math, maybe it's close to
  //a multiple of E
  const func = (x, m) => m - m/(Math.E ** ((4/m) * x));
  if (value instanceof THREE.Vector2) {
    const { x, y } = value;
    if (!(max instanceof THREE.Vector2)) max = new THREE.Vector2(max, max);
    return new THREE.Vector2(func(x, max.x), func(y, max.y));
  }
  return func(value, max);
};

const incidentVec = (vec, norm) => {
  return norm.multiplyScalar(2 * norm.dot(vec)).add(vec);
};

const forwardVec = (euler) => {
  const quat = euler.toQuaternion();
  quat.setFrom
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
        this.root.scale.multiplyScalar(0.5);
        //= new THREE.CubeMesh();
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

  tickPhysics(ctx, delta) {
    if (!this.root) return;
    const {
      wind: {
        velocity: windV,
      },
      sea: {
        velocity: seaV,
      },
      boat: {
        mass: boatMass,
        velocity,
        position,
        rotation: boatRot,
        boomRotation: boomRot,
        tillerMass: tillMass,
        controls: {
          mainshaftTautPercent: mainshaftValue,
          tillerFromLeftPercent: tillValue,
        }
      }
    } = ctx.state;

    // TODO: thanks to mutable vectors, state-wise this is a mess...
    // be careful reusing a variable for now, we 'll just clone a lot soon

    const origin = new THREE.Vector2();
    const xAxis = new THREE.Vector2(1, 0);
    const boatDir = xAxis.clone().rotateAround(origin, boatRot);

    const zAxis = new THREE.Vector3(0, 0, 1);
    const rotateAroundZ = (v, theta) => v.clone().rotateAround(origin, theta);
    const rotateAroundZ3 = (v, theta) => v.clone().applyAxisAngle(zAxis, theta);

    const boomDir = xAxis.clone().rotateAround(origin, boomRot);
    const boomNorm = rotateAroundZ(boomDir, Math.PI/4).normalize();
    const windPush = incidentVec(windV, boomNorm).multiplyScalar(-1);

    const tillMinAngle = -Math.PI/3, tillMaxAngle = Math.PI/3;
    const tillMin = rotateAroundZ(boatDir.multiplyScalar(-1), tillMinAngle);
    const tillMax = rotateAroundZ(boatDir.multiplyScalar(-1), tillMaxAngle);
    const tillAngularRange = tillMaxAngle - tillMinAngle;
    const tillDir = rotateAroundZ(tillMin, tillValue * tillAngularRange).normalize();
    const tillNorm = rotateAroundZ(tillDir, Math.PI/4); // may need to reflect

    const waterRelativeVelocity = seaV.clone().sub(velocity);

    // TODO: need to reflect normal over boat forward axis?
    const tillPush = incidentVec(waterRelativeVelocity, tillNorm);

    const acceleration = windPush.clone().divideScalar(boatMass).add(tillPush.clone().divideScalar(tillMass));

    // simulate drag with smoothing and clamping
    const maxVelocity = 5;
    const rawNextVelocity = velocity.clone().add(acceleration.multiplyScalar(delta));
    const smoothedNextVelocity = smoothClampCurve(rawNextVelocity, maxVelocity);

    ctx.state.boat.velocity = smoothedNextVelocity;
    const { x, y } = position.add(smoothedNextVelocity.multiplyScalar(delta));

    this.root.position.set(x, y, 0.0);
  }

  tick(ctx, delta = 0) {
    //this.root.rotation.x += delta * 0.5;
    this.uniforms.time.value += delta;
    this.tickPhysics(ctx, delta);
  }
};

export default Boat;

