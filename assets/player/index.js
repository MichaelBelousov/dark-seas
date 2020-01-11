
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";

const clamp = (val, min, max) => {
  return Math.min(Math.max(val, min), max);
};

class Player {
  static async load() { return; }

  constructor (ctx) {
    this.keys = {};
    this.mouseLoc = new THREE.Vector2(0, 0);
    document.addEventListener('keydown', e => {
      e.preventDefault();
      this.keys[e.key] = true;
    });
    document.addEventListener('keyup', e => {
      e.preventDefault();
      this.keys[e.key] = false;
    });
    document.addEventListener('mousemove', e => {
      e.preventDefault();
      const { x, y } = e;
      this.mouseLoc = new THREE.Vector2(x, y);
    });
  }

  tick(ctx, delta = 0) {
    const tillerMaxTurnPerSec = 2.0; // takes 0.5 sec to turn tiller 100%
    const { tillerFromLeftPercent } = ctx.state.boat.controls;
    if (this.keys['a']) {
      ctx.state.boat.controls.tillerFromLeftPercent =
        clamp(tillerFromLeftPercent - tillerMaxTurnPerSec * delta, 0, 1); 
    }
    if (this.keys['d']) {
      ctx.state.boat.controls.tillerFromLeftPercent =
        clamp(tillerFromLeftPercent + tillerMaxTurnPerSec * delta, 0, 1); 
    }
    const corner = new THREE.Vector2(0, 0);
    const center = new THREE.Vector2(window.clientX/2, window.clientY/2);
    const maxDist = corner.distanceTo(center);
    ctx.state.boat.controls.mainshaftTautPercent = this.mouseLoc.distanceTo(center) / maxDist;
  }
};

export default Player;



