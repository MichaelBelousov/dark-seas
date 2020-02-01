
//import THREE from "three.js";
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import MainLevel from "./levels/main.js";


(async () => {
  await MainLevel.load();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.autoClear = false;

  const clock = new THREE.Clock();

  // Game State object to control variables
  const gameState = {
    input: {
      tillerFromLeftPercent: 0.0, // 0-1, 100%left-100%right
      mainshaftTautPercent: 0.5, // 0-1, 0:full slack-1:full taut
    },
    boat: {
      velocity: new THREE.Vector2(0, 1),
      position: new THREE.Vector2(),
      mass: 100.0,
      rotation: 0.0,
      get orientation() {
        const origin = new THREE.Vector2();
        return new THREE.Vector2(1, 0).rotateAround(origin, this.rotation);
      },
      boom: {
        rotation: Math.PI,
        get orientation() {
          const origin = new THREE.Vector2();
          return new THREE.Vector2(1, 0).rotateAround(origin, this.rotation);
        },
        gripForce: 0.0,
      },
      tiller: {
        rotation: 0.0,
        get orientation() {
          const origin = new THREE.Vector2();
          return new THREE.Vector2(1, 0).rotateAround(origin, this.rotation);
        },
        mass: 5.0, // technically rutter mass...
      },
    },
    wind: {
      velocity: new THREE.Vector2(2, 0.2),
    },
    sea: {
      velocity: new THREE.Vector2(0.2, 0.2),
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

