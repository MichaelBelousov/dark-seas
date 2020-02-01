
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";

/** @type {Record<string, THREE.ArrowHelper>} */
const liveArrows = {};

/** 
 * Get a unique color hex string (#rrggbb) from a string
 * @param {string} key - hash input
 */
const colorHash = (key) => {
  const num = Array.from(key).reduce(
    (prev, cur, i) => prev - 4529*cur.chatCodeAt(0) << i*719,
    0
  );
  const capped = num % 256**3;
  console.log(capped);
  return `#{capped.toString(16).padStart(6, "0"}`;
};

/**
 * Draw a debug arrow from `from` to `to` or draw arrow
 * {arrow} optionally from `from`, reset an existing arrow
 * to the parameters if {handle} is supplied.
 * @param {{
 *   from?: THREE.Vector3;
 *   to?: THREE.Vector3;
 *   arrow?: THREE.Vector3;
 *   color?: string;
 *   handle?: string;
 *   scene?: THREE.Scene;
 * }} namedArgs
 */
export const drawArrow = ({ from, to, arrow, color, handle, scene }) => {
  from = from ?? new THREE.Vector3();
  color = color ?? (handle ? colorHash(handle) : "#ff0000");
  if (to) arrow = to.clone().sub(from); 
  let length = arrow.length();
  let dir = arrow.clone().normalize();

  let result;
  if (handle && handle in liveArrows) {
    result = liveArrows[handle];
    result.setDirection(dir);
    result.setLength(length);
    if (color) result.setColor(color);
  } else {
    result = new THREE.ArrowHelper(dir, from, length, color);
    if (handle) liveArrows[handle] = result;
    scene.add(result);
  }
  return result;
};

export const rotateVecZ = (vec, theta) => {
  if (vec instanceof THREE.Vector3) {
    const zAxis = new THREE.Vector3(0, 0, 1);
    return vec.clone().applyAxisAngle(zAxis, theta);
  }
  if (vec instanceof THREE.Vector2) {
    const origin = new THREE.Vector2(0, 0);
    return vec.clone().rotateAround(origin, theta);
  }
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
 * Get the (length-preserving) reflected vector of `vec` to a
 * surface defined by a normal vector `norm` (must be normalized)
 * @param {THREE.Vector3} vec
 * @param {THREE.Vector3} norm
 */
export const reflectedVec = (vec, norm) => {
  return (
    norm.clone().multiplyScalar(2 * norm.dot(vec)
    ).sub(vec).normalize(
    ).multiplyScalar(vec.length())
  );
};

