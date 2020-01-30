
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";

/**
 * Draw a debug arrow from {from} to {to} or draw arrow
 * {arrow} optionally from {from}
 * @param {{
 *   from?: THREE.Vector3,
 *   to?: THREE.Vector3,
 *   arrow?: THREE.Vector3,
 *   color?: string
 * }} namedArgs
 * */
export const drawArrow = ({ from, to, arrow, color }) => {
  from = from ?? new THREE.Vector3();
  color = color ?? "#ff0000";
  if (to) arrow = to.clone().sub(from); 
  let length = arrow.length();
  let dir = arrow.normalize();
  return new THREE.ArrowHelper(dir, from, length, color);
};

