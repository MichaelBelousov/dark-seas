
//import THREE from "three.js";
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import MainLevel from "./levels/main.js";


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
    if (key === "w" && gameState.boat.taught <= 15) {
      gameState.boat.taught += 0.01;
    } else if (key === "s" && gameState.boat.taught >= -15) {
      gameState.boat.taught += -0.01;
    } else if (key === "a") {
      cube.rotation.z = -0.1;
      console.log("key fired");
    } else if (key === "d" && gameState.boat.till <= 15) {
      gameState.boat.till += 0.1;
    }
  });

  // sample geom, will replace with boat soon

  const clock = new THREE.Clock();

  //Game State object to control variables
  const gameState = {
    boat: {
      controls: {
        tillerFromLeftPercent: 0.0, // 0-1, 100%left-100%right
        mainshaftTautPercent: 0.5, //0-1, 0:full slack-1:no slack
      },
      velocity: new THREE.Vector2(0, 1),
      rotation: 0.0,
      boomRotation: 0.0,
      position: new THREE.Vector2(),
      boomOrientation: new THREE.Vector2(1, 0),
      mass: 100.0,
      tillerMass: 5.0,
    },
    wind: {
      velocity: new THREE.Vector2(0, 0),
    },
    sea: {
      velocity: new THREE.Vector2(0, 0),
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
    ctx.camera.aspect = window.innerWidth / window.innerHeight;
    ctx.camera.updateProjectionMatrix();
    ctx.renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const tickLogic = (delta) => {
    level.tick(ctx, delta);
  };

  const run = () => {

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    var cube = new THREE.Mesh(geometry, material);
    ctx.scene.add(cube);

    const tickGame = () => {
      const delta = clock.getDelta();

      cube.rotation.z += gameState.boat.till;

      requestAnimationFrame(tickGame); // causes async feedback loop
      tickLogic(delta);
      renderer.render(ctx.scene, ctx.camera);
    };
    tickGame();
  };

  run();
})();

