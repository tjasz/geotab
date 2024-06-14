export type Point = { x: number; y: number };

export function square(x: number) {
  return x * x;
}

export function moveAlongBearing(
  p: Point,
  dist: number,
  bearingRadians: number
): Point {
  return {
    x: p.x + dist * Math.cos(bearingRadians),
    y: p.y + dist * Math.sin(bearingRadians),
  }
}

export function dist(p1: Point, p2: Point) {
  return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y));
}

export function rotateAroundOrigin(p: Point, radians: number): Point {
  const magnitude = Math.sqrt(square(p.x) + square(p.y));
  const originalBearing = Math.atan2(p.y, p.x);
  const result: Point = {
    x: magnitude * Math.cos(originalBearing + radians),
    y: magnitude * Math.sin(originalBearing + radians),
  };
  return result;
}