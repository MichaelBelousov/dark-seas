
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.js";

// a good reason to use webpack...
const [
  vertShader,
  fragShader
] = Promise.all([
  fetch('/assets/water/vert.glsl'),
  fetch('/assets/water/frag.glsl')
]);

// basic actor setup
class Water {
  static async build(ctx) {
    this.uniforms = {
      fogDensity: { value: 0.2 },
      fogColor: { value: new THREE.Vector3(0, 0, 0) },
      time: { value: 1.0 },
      uvScale: { value: new THREE.Vector2(1.0, 1.0) },
      texture1: { value: ctx.textureLoader.load('textures/noise.png') },
      texture2: { value: ctx.textureLoader.load('textures/water.png') },
    };
    this.uniforms.texture1.value.wrapS = this.uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
    this.uniforms.texture2.value.wrapS = this.uniforms.texture2.value.wrapT = THREE.RepeatWrapping;

    const size = 0.65;
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertShader.body,
      fragmentShader: fragShader.body
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(size, 0.3, 30, 30), this.material);

    ctx.scene.add(this.mesh);
  }

  tick(ctx) {
    this.position.x = ctx.camera.position.x;
    this.position.y = ctx.camera.position.y;
  }
};

export default Water;

