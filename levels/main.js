
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";
import {OrbitControls} from "https://threejsfundamentals.org/threejs/resources/threejs/r113/examples/jsm/controls/OrbitControls.js";
import Water from "../assets/water/index.js";
import Boat from "../assets/boat/index.js";
import Player from "../assets/player/index.js";

export class MainLevel {

  static async load() {
    await Water.load();
    await Boat.load();
    await Player.load();
  }

  constructor(ctx) {
    this.physicsWorld = ctx.physicsWorld;
    this.scene = ctx.scene = new THREE.Scene();
    this.physicsWorld = ctx.physicsWorld;
    
    
    //Camera
    this.camera = ctx.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    function updateCamera() {
      camera.updateProjectionMatrix();
    }
    
    // background
    this.scene.background = new THREE.Color(0x202020);
    // XXX: uses a partial context just for this object that
    // we know will work
    this.water = new Water(ctx);
    this.boat = this.spawn(Boat);
    this.player = new Player(ctx);


    // lighting
    const hemi = new THREE.HemisphereLight(0x443333, 0x111122);
    this.scene.add(hemi);

    const spot1 = new THREE.SpotLight(0xffffbb, 2);
    spot1.position.set(0.5, 0, 1);
    spot1.position.multiplyScalar(700);
    this.scene.add(spot1);
    spot1.castShadow = true;
    spot1.shadow.mapSize.height = 1024;
    spot1.shadow.mapSize.width = 1024;
    spot1.shadow.camera.near = 200;
    spot1.shadow.camera.far = 1500;
    spot1.shadow.camera.fov = 40;
    spot1.shadow.bias = -0.005;

    this.arrow = new THREE.Vector3(2, 2, 0);
  }

  spawn(Type) {
    const instance = new Type(this.scene);
    instance.spawnPhysics(this.physicsWorld);
    return instance;
  }

  tick(ctx, delta) {
    this.water.tick(ctx, delta);
    this.boat.tick(ctx, delta);
    this.player.tick(ctx, delta);
  }
};

export default MainLevel;

