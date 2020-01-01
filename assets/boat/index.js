
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
const rotateVecZ = (vec, theta) => {
  const cos = Math.cos(theta), sin = Math.sin(theta);
  const { x, y, z } = vec;
  return THREE.Vector3(x*cos - y*sin, x*sin + y*cos, z);
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

  tickPhysics(ctx, delta) {
    const {
      windVelocity: windV,
      seaVelocity: seaV
    } = ctx.state.world;
    const {
      boatOrientation: boatDir,
      tillerValue,
      boomOrientation: boomDir,
      mass,
      velocity,
      position,
    } = ctx.state.boat;

    const boomNorm = rotateVecZ(boomDir, Math.PI/4);

    const windPush = -2 * (boomNorm.dot(windV)).multiply(boomNorm) + windV;

    const boatTillerMinAngle = Math.PI/, boatTillerMaxAngle = ;
    const tillerAngle = -boatDir

    const forces = windPush + tillerPush;

    const acceleration = forces / mass;
    const newVelocity = velocity + acceleration * delta;
    const newPosition = position + velocity * delta;

    this.root.position = newPosition;
  }

  tick(ctx, delta = 0) {
    //this.root.rotation.x += delta * 0.5;
    this.uniforms.time.value += delta;
    tickPhysics(ctx, delta);
  }
};

export default Boat;

