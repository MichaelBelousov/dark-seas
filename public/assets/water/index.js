
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import { globalUniforms } from "../../index.js";

const resolve = path => '/assets/water/' + path;

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
  }
};

// basic actor setup
class Water {
  static async load() {
    // a good reason to use webpack...
    // avoiding this async loading garbage
    await Promise.all(Object.values(resources).map(async r => {
      if (!r.loaded) {
        const resp = await fetch(r.path);
        r.value = await resp.text();
        r.loaded = true;
      }
    }));
  }

  constructor (ctx) {

    this.uniforms = new Proxy({
      fogDensity: { value: 0.2 },
      fogColor: { value: new THREE.Vector3(0, 0, 0) },
      uvScale: { value: new THREE.Vector2(1.0, 1.0) },
      texture1: { value: ctx.textureLoader.load('noise.png') },
      texture2: { value: ctx.textureLoader.load('bubbles.png') },
    }, { 
      get: (uniforms, key) => ((key in uniforms) ? uniforms : globalUniforms)[key],
    });
    this.uniforms.texture1.value.wrapS = this.uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
    this.uniforms.texture2.value.wrapS = this.uniforms.texture2.value.wrapT = THREE.RepeatWrapping;

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: resources.vertShader.value,
      fragmentShader: resources.fragShader.value
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(3, 3, 1, 1), this.material);
    ctx.scene.add(this.mesh);
  }

  tick(ctx, delta = 0) {
    this.mesh.position.x = ctx.camera.position.x;
    this.mesh.position.y = ctx.camera.position.y;
    this.mesh.rotation.x += 0.2 * delta;
    this.mesh.rotation.x += 0.2 * delta;
  }
};

export default Water;

