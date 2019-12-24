
//import THREE from "three.js";
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import LoadWater, { Water } from "./assets/water/index.js";
import MainLevel from "./levels/main.js";

//const scene = new THREE.Scene();


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.autoClear = false;

// TODO: move to some input handling file maybe
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

const tickLogic = () => {
  cube.rotation.y += gameState.boat.till * .5;
  cube.y += gameState.boat.taught;
};

const clock = new THREE.Clock();

export const globalUniforms = {
  time: { value: 0 }
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

const textureLoader = new THREE.TextureLoader();

const gameContext = {
  state: gameState,
  level: new MainLevel(),
  get scene() { return this.level.scene },
  get camera() { return this.level.camera },
  textureLoader,
  renderer,
};

//scene.add(cube);


const run = () => {
  const tickGame = () => {
    globalUniforms.time.value += clock.getDelta();
    requestAnimationFrame(tickGame); // causes async feedback loop
    tickLogic();
    renderer.render(gameContext.scene, gameContext.camera);
  };
  tickGame();
};


(async () => {
  await LoadWater();
  run();
})();

