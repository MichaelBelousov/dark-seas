
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.js";


const backgroundImg = new THREE.TextureLoader().load("images/water.png");
const backgroundMat = new THREE.Material(

);

const backgroundGeom = new THREE.PlaneGeometry();
const background = new THREE.Mesh(backgroundGeom, backgroundMat);

// basic actor setup
class Water {
  constructor (scene) {
    scene.add(waterMesh);
  }

  tick(ctx) {
    this.position.x = ctx.camera.position.x;
    this.position.y = ctx.camera.position.y;
  },
};

export default Water;

