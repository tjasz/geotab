const radPerDeg = Math.PI / 180.0;

// sin of a in degrees
export function dsin(a: number): number {
  return Math.sin(a * radPerDeg);
}
// cos of a in degrees
export function dcos(a: number): number {
  return Math.cos(a * radPerDeg);
}

export function dasin(v: number): number {
  return Math.asin(v) / radPerDeg;
}

export function datan2(y: number, x: number): number {
  return Math.atan2(y, x) / radPerDeg;
}

// get the resulting point from traveling r distance from (0,0) at angle a in degrees
export function ar(a: number, r: number): [number, number] {
  return [r * dsin(a), r * dcos(a)];
}

// sum a number array
export function sum(a: number[]): number {
  return a.reduce((s, v) => s + v, 0);
}

// get the minimum of an array after mapping its values to a number
export type numberTransform<T> = { (a: T): number };
export function mapMin<T>(a: T[], f: numberTransform<T>): number {
  return a.reduce((m, v) => {
    const fv = f(v);
    return fv < m ? fv : m;
  }, Infinity);
}

export function dotProduct(a: number[], b: number[]) {
  if (a.length !== b.length) {
    throw Error(
      `Cannot take dot product of different-length vectors: ${a}, ${b}.`,
    );
  }
  return sum(a.map((ac, i) => ac * b[i]));
}

export function crossProduct(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  const [a1, a2, a3] = a;
  const [b1, b2, b3] = b;
  return [a2 * b3 - a3 * b2, a3 * b1 - a1 * b3, a1 * b2 - a2 * b1];
}

export function L2norm(a: number[]): number {
  return Math.sqrt(dotProduct(a, a));
}

export function scalarProduct(a: number[], s: number): number[] {
  return a.map((v) => v * s);
}

export function normalize(a: number[]) {
  return scalarProduct(a, 1 / L2norm(a));
}

export default {
  dsin,
  dcos,
  dasin,
  datan2,
  ar,
  sum,
  mapMin,
  dotProduct,
  crossProduct,
  L2norm,
  scalarProduct,
  normalize,
};
