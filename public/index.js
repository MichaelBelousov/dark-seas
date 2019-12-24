
//import THREE from "three.js";
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import Water from "./assets/water/index.js";
import MainLevel from "./levels/main.js";

console.log(THREE);
window.THREE = THREE;
console.log(THREE.Scene);

const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.autoClear = false;

renderer.domElement.addEventListener('keydown', e => {
  e.preventDefault(); //prevent native scroll handling?
  const { key } = e;
  if (key === "w"){
    gameState.boat.taught = 1;
  } else if (key === "s") {
    gameState.boat.taught = -1;
  }
});

// sample geom, will replace with boat soon

const geom = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geom, material);

scene.add(cube);

const engineStartTime = Date.now();
let lastFrameTime = engineStartTime;

const tickLogic = () => {
  cube.rotation.y += gameState.boat.till * .5;
  cube.y += gameState.boat.taught;
};

const clock = new THREE.Clock();

export const globalUniforms = {
  time: { value: 0 }
};

const run = () => {
  const tickGame = () => {
    globalUniforms.time.value += clock.getDelta();
    requestAnimationFrame(tickGame); // causes async feedback loop
    tickLogic();
    renderer.render(scene, camera);
  };
  tickGame();
};

const gameState = {
  boat: {
    velocity: new THREE.Vector2(0, 1),
    till: 0.5, // 0-1, 100%left-100%right
    taught: 0.5, //0-1, 0:full slack-1:no slack
    sailOrientation: new THREE.Vector2(1,0),
  },
  wind: {
    speed: new THREE.Vector2(0, 0),
  }
};

run();

