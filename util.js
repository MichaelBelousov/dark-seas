
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";

/**
 * Draw a debug arrow from `from` to `to` or draw arrow
 * {arrow} optionally from `from`
 * @param {{
 *   from?: THREE.Vector3,
 *   to?: THREE.Vector3,
 *   arrow?: THREE.Vector3,
 *   color?: string
 * }} namedArgs
 */
export const drawArrow = ({ from, to, arrow, color }) => {
  from = from ?? new THREE.Vector3();
  color = color ?? "#ff0000";
  if (to) arrow = to.clone().sub(from); 
  let length = arrow.length();
  let dir = arrow.clone().normalize();
  return new THREE.ArrowHelper(dir, from, length, color);
};

export const rotateVecZ = (vec, theta) => {
  const cos = Math.cos(theta), sin = Math.sin(theta);
  const { x, y, z } = vec;
  return new THREE.Vector3(x*cos - y*sin, x*sin + y*cos, z);
};

// smoothly cap a curve with a maximum upper bound
export const smoothClampCurve = (value, max) => {
  //not sure why 4 seems to give it a linear proportion, should do the math, maybe it's close to
  //a multiple of E
  const func = (x, m) => m - m/(Math.E ** ((4/m) * x));
  if (value instanceof THREE.Vector3) {
    const { x, y, z } = value;
    if (!(max instanceof THREE.Vector3)) max = new THREE.Vector3(max, max, max);
    return Three.Vector3(func(x, max.x), func(y, max.y), func(z, max.z));
  }
  return func(value, max);
};

/**
 * Get the incident (reflected) vector of `vec` to a
 * surface defined by a normal vector `norm` (preserves length)
 * @param {THREE.Vector3} vec
 * @param {THREE.Vector3} norm
 */
export const incidentVec = (vec, norm) => {
  norm = norm.clone();
  return norm.multiply(
    norm.clone().multiplyScalar(
      2 * norm.dot(vec)
    )
  ).sub(
    vec
  ).normalize(
  ).multiplyScalar(vec.length());
};

