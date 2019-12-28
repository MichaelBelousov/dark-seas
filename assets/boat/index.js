
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/loaders/DRACOLoader.js";

const resolve = path => '/assets/boat/' + path;

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
    path: resolve('boat.glb'),
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
        console.log(this.root.children);
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

  tick(ctx, delta = 0) {
    //replace with position.set(...camera.pos.xy)
    this.mesh.rotation.x += delta * 0.01;
    this.mesh.rotation.y = delta * 0.01;
    this.uniforms.time.value += delta;
  }
};

export default Boat;

