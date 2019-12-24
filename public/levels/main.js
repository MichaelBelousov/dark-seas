
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.js";

class MainLevel {
  constructor () {
    this.scene = new THREE.Scene();

    // background
    scene.add(waterMesh?);
    scene.background = new THREE.Color(0x000000);

    // lighting
    const hemi = new THREE.HemisphereLight(0x443333, 0x111122);
    scene.add(hemi);

    const spot1 = new THREE.SpotLight(0xffffbb, 2);
    spot1.position.set(0.5, 0, 1);
    spot1.position.multiplyScalar(700);
    scene.add(spot1);
    spot1.castShadow = true;
    spot1.shadow.mapSize.height = 1024;
    spot1.shadow.mapSize.width = 1024;
    spot1.shadow.camera.near = 200;
    spot1.shadow.camera.far = 1500;
    spot1.shadow.camera.fov = 40;
    spot1.shadow.bias = -0.005;

  }

  spawn(Type) {
    const instance = Type(scene);
  }

  tick(ctx) {
    this.position.x = ctx.camera.position.x;
    this.position.y = ctx.camera.position.y;
  },
};

export default MainLevel;

