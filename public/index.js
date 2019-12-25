
//import THREE from "three.js";
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import MainLevel from "./levels/main.js";


export const globalUniforms = {
  time: { value: 0 }
};

(async () => {
  await MainLevel.load();

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

  const clock = new THREE.Clock();

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

  //context is incomplete until level is loaded/made
  const partialContext = {
    state: gameState,
    level: undefined,
    scene: undefined,
    camera: undefined,
    textureLoader,
    renderer,
  };

  const level = new MainLevel(partialContext);

  const ctx = {
    ...partialContext,
    level,
    scene: level.scene,
    camera: level.camera,
  };

  window.addEventListener('resize', () => {
    ctx.camera.aspect = window.innerWidth/window.innerHeight;
    ctx.camera.updateProjectionMatrix();
    ctx.renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const tickLogic = (delta) => {
    level.tick(ctx, delta);
  };

  const run = () => {
    const tickGame = () => {
      const delta = clock.getDelta();
      globalUniforms.time.value += delta;
      requestAnimationFrame(tickGame); // causes async feedback loop
      tickLogic(delta);
      renderer.render(ctx.scene, ctx.camera);
    };
    tickGame();
  };

  run();
})();

