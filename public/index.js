
//import THREE from "three.js";
const THREE = window.THREE;

const scene = new THREE.Scene();

const backgroundImg = new THREE.TextureLoader().load("images/water.png");
const backgroundMat = new THREE.Material(

);
const backgroundGeom = new THREE.PlaneGeometry(0, 0, 1);
const background = new THREE.Mesh(backgroundGeom, backgroundMat);

export const textureLoader = new THREE.TextureLoader();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer(); // TODO: use WeblGL2?
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// sample geom, will replace with boat soon

const geom = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geom, material);

scene.add(cube);

const engineStartTime = Date.now();
let lastFrameTime = engineStartTime;

const tickLogic = () => {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
};

const clock = new THREE.Clock();

export const globalUniforms = {
  time: { value: 0 }
};

const run = () => {
  const tickGame = () => {
    globalUniforms.time.value += clock.getDelta();
    requestAnimationFrame(tickEngine); // causes async feedback loop
    tickLogic();
    renderer.render(scene, camera);
  };
  tickGame();
};

run();

