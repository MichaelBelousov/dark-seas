
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import { globalUniforms } from "../../index.js";

let resources = {
  vertShader:  {
    value: undefined,
    loaded: false,
    path: './vert.glsl',
  },
  fragShader: {
    value: undefined,
    loaded: false,
    path: './frag.glsl'
  }
};

// basic actor setup
class Water {
  static async load() {
    // a good reason to use webpack...
    // avoiding this async loading garbage
    await Promise.all(Object.values(resources).map(async (r) => {
      if (!r.loaded) {
        const resp = await fetch(r.path);
        r.value = resp.text();
        r.loaded = true;
      }
    }));
  }

  constructor (ctx) {

    this.uniforms = new Proxy({
      fogDensity: { value: 0.2 },
      fogColor: { value: new THREE.Vector3(0, 0, 0) },
      time: { value: 1.0 },
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

    const size = 0.65;
    this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(size, 0.3, 30, 30), this.material);

    ctx.scene.add(this.mesh);
  }

  tick(ctx) {
    this.position.x = ctx.camera.position.x;
    this.position.y = ctx.camera.position.y;
  }
};

export default Water;

