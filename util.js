
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js";

const memoizedHashes = {};

/** 
 * Get a unique color hex string (#rrggbb) from a string
 * @param {string} key - hash input
 */
const colorHash = (key) => {
  if (key in memoizedHashes) {
    return memoizedHashes[key];
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const chr = key.charCodeAt(i);
    hash = ((hash << 3) - hash * 41) + chr;
    hash &= hash;
  }
  hash = Math.abs(hash % 256**3);
  const result = `#${hash.toString(16).padStart(6, "0")}`;
  memoizedHashes[key] = result;
  return result;
};


/** @type {Record<string, THREE.ArrowHelper>} */
const liveArrows = {};

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
  if (arrow instanceof THREE.Vector2) arrow = new THREE.Vector3(...arrow, 0);
  if (from instanceof THREE.Vector2) from = new THREE.Vector3(...arrow, 0);
  let length = arrow.length();
  let dir = arrow.clone().normalize();

  let result;
  if (handle && handle in liveArrows) {
    result = liveArrows[handle];
    result.setDirection(dir);
    result.setLength(length);
    result.position.set(...from);
    if (color) result.setColor(color);
  } else {
    result = new THREE.ArrowHelper(dir, from, length, color);
    if (handle) liveArrows[handle] = result;
    if (scene) scene.add(result);
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
  // turns out at least THREE.Vector3 already has this as a method
  return (
    norm.clone().multiplyScalar(2 * norm.dot(vec)
    ).sub(vec).normalize(
    ).multiplyScalar(vec.length())
  );
};

