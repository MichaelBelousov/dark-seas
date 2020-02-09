
//import THREE from "three.js";
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import MainLevel from "./levels/main.js";
const pl = window.planck;

(async () => {
  await MainLevel.load();

  const physicsWorld = pl.World({ gravity: pl.Vec2(0,0) });
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
      velocity: new THREE.Vector2(0, 0),
      angularVelocity: new THREE.Vector3(),
      position: new THREE.Vector2(),
      mass: 20.0,
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
      rutter: {
        rotation: 0.0,
        get orientation() {
          const origin = new THREE.Vector2();
          return new THREE.Vector2(1, 0).rotateAround(origin, this.rotation);
        },
        mass: 5.0, //kg
        length: 1, //m
      },
      hull: {
        depth: 1, //m
        length: 4, //m
      }
    },
    wind: {
      velocity: new THREE.Vector2(2, 0.2),
    },
    sea: {
      velocity: new THREE.Vector2(0.2, 0.2),
    }
  };

Window.addEventListener


  const textureLoader = new THREE.TextureLoader();

  //context is incomplete until level is loaded/made
  const partialContext = {
    state: gameState,
    level: undefined,
    scene: undefined,
    camera: undefined,
    textureLoader,
    renderer,
    physicsWorld,
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

    //const tickGame = () => {
    pl.testbed('dark-seas', (testbed) => {
      testbed.speed = 1.3;
      testbed.hz = 50;
      ctx.testbed = testbed;

      const delta = clock.getDelta();
      tickLogic(delta);
      //renderer.render(ctx.scene, ctx.camera);
      physicsWorld.step(delta);
      return physicsWorld;
      //requestAnimationFrame(tickGame); // loop
    });

    //tickGame();
  };

  run();
})();

