import * as gj from "./geojson-types";
import math from "./math";

const earthRadiusMeters = 6371e3;

// transform GeoJSON coordinate lon/lat to 3d cartesian coordiante
function toCartesian(pt: gj.Coordinate): [number, number, number] {
  const [lon, lat] = pt;
  return [
    earthRadiusMeters * math.dcos(lat) * math.dcos(lon),
    earthRadiusMeters * math.dcos(lat) * math.dsin(lon),
    earthRadiusMeters * math.dsin(lat),
  ];
}
function fromCartesian(pt: [number, number, number]): gj.Coordinate {
  const [x, y, z] = pt;
  const lat = math.dasin(z / earthRadiusMeters);
  const lon = math.datan2(y, x);
  return [lon, lat];
}

// get the lateral distance between two Coordinates/Points
// TODO replace algorithm.tsx getDistance()
export function distance(pta: gj.Coordinate, ptb: gj.Coordinate): number {
  if (pta[0] === ptb[0] && pta[1] === ptb[1]) return 0;
  // Use haversine formula to calcualte distance between two points.
  // Since haversine formula computes distance on a sphere,
  // degrees of latitude and longitude are treated as equal lengths,
  // so using an average earth radius makes sense.
  // Average earth radius: https://en.wikipedia.org/wiki/Earth_radius
  // Recall that GeoJSON coordiantes are [lon,lat].
  const delta_lat = pta[1] - ptb[1];
  const delta_lon = pta[0] - ptb[0];
  const sin_half_delta_lat = math.dsin(delta_lat / 2);
  const sin_half_delta_lon = math.dsin(delta_lon / 2);
  const a =
    sin_half_delta_lat * sin_half_delta_lat +
    math.dcos(ptb[1]) *
    math.dcos(pta[1]) *
    sin_half_delta_lon *
    sin_half_delta_lon;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = c * earthRadiusMeters;
  return d;
}
// compute the nearest point to reference point p0 on an a great circle line defined by a pair of points
function nearestPointGreatCircle(
  p0: gj.Coordinate,
  ls: [gj.Coordinate, gj.Coordinate],
): gj.Coordinate {
  const [p1, p2] = ls;
  const a = toCartesian(p1);
  const b = toCartesian(p2);
  const c = toCartesian(p0);

  const G = math.crossProduct(a, b);
  const F = math.crossProduct(c, G);
  const T = math.scalarProduct(
    math.normalize(math.crossProduct(G, F)),
    earthRadiusMeters,
  );
  return fromCartesian(T as [number, number, number]);
}
// determine if a given point is on a line segment defined by a pair of points
export function onSegment(
  p0: gj.Coordinate,
  ls: [gj.Coordinate, gj.Coordinate],
): boolean {
  // p0 is on p1->p2 if dist(p1,p0) + dist(p0,p2) == dist(p1,p2)
  const [p1, p2] = ls;
  const distThroughP0 = distance(p1, p0) + distance(p0, p2);
  const distLineSeg = distance(p1, p2);
  return Math.abs(distThroughP0 - distLineSeg) < 1e-9;
}
// compute the distance from a point to a line segment defined by a pair of points
export function distanceToLineSeg(
  p0: gj.Coordinate,
  ls: [gj.Coordinate, gj.Coordinate],
): number {
  // https://stackoverflow.com/questions/1299567/how-to-calculate-distance-from-a-point-to-a-line-segment-on-a-sphere
  const proj = nearestPointGreatCircle(p0, ls);
  if (onSegment(proj, ls)) {
    return distance(proj, p0);
  }
  return math.mapMin(ls, (c) => distance(p0, c));
}

// define functions get getting distance between all GeoJSON geometries
function distancePointToPoint(a: gj.Point, b: gj.Point): number {
  return distance(a.coordiantes, b.coordinates);
}
function distancePointToMultiPoint(a: gj.Point, b: gj.MultiPoint): number {
  return math.mapMin(b.coordinates, (ptb) => distance(ptb, a.coordinates));
}
function distancePointToLineString(a: gj.Point, b: gj.LineString): number {
  let res = Infinity;
  for (let i: number = 1; i < b.coordinates.length; i++) {
    const candidate = distanceToLineSeg(a.coordinates, [
      b.coordinates[i - 1],
      b.coordinates[i],
    ]);
    if (candidate < res) {
      res = candidate;
    }
  }
  return res;
}
function distancePointToMultiLineString(
  a: gj.Point,
  b: gj.MultiLineString,
): number {
  let res = Infinity;
  for (let i: number = 0; i < b.coordinates.length; i++) {
    for (let j: number = 1; j < b.coordinates[i].length; j++) {
      const candidate = distanceToLineSeg(a.coordinates, [
        b.coordinates[i][j - 1],
        b.coordinates[i][j],
      ]);
      if (candidate < res) {
        res = candidate;
      }
    }
  }
  return res;
}
type featureDistanceFunction = {
  (
    a: gj.Geometry | gj.GeometryCollection,
    b: gj.Geometry | gj.GeometryCollection,
  ): number;
};
// TODO define all featureDistanceFunctions
const featureDistanceFunctions: [
  gj.GeometryType,
  gj.GeometryType,
  featureDistanceFunction,
][] = [
    [
      gj.GeometryType.Point,
      gj.GeometryType.Point,
      (a, b) => distancePointToPoint(a as gj.Point, b as gj.Point),
    ],
    [
      gj.GeometryType.Point,
      gj.GeometryType.MultiPoint,
      (a, b) => distancePointToMultiPoint(a as gj.Point, b as gj.MultiPoint),
    ],
    [
      gj.GeometryType.Point,
      gj.GeometryType.LineString,
      (a, b) => distancePointToLineString(a as gj.Point, b as gj.LineString),
    ],
    [
      gj.GeometryType.Point,
      gj.GeometryType.LineString,
      (a, b) =>
        distancePointToMultiLineString(a as gj.Point, b as gj.MultiLineString),
    ],
  ];
export function distanceBetweenFeatures(a: gj.Feature, b: gj.Feature): number {
  const functions = featureDistanceFunctions.filter(
    ([t1, t2, f]) => t1 === a.geometry.type && t2 === b.geometry.type,
  );
  if (functions.length === 0) {
    throw Error(
      `Distance function not defined for feature geometries of types: ${a.geometry.type}, ${b.geometry.type}.`,
    );
  }
  const f = functions[0][2];
  return f(a.geometry, b.geometry);
}

// return the number of digits after the decimal that are necessary to include in a degree measurement
// to meet the minimum precision in meters given
function precisionMetersToDegreeDigits(precisionMeters: number): number {
  return Math.ceil(Math.log10((1852 * 60) / precisionMeters));
}
function simplifyCoordinate(
  c: gj.Coordinate,
  precisionMeters: number,
): gj.Coordinate {
  const dplaces = precisionMetersToDegreeDigits(precisionMeters);
  const roundingFactor = Math.pow(10, dplaces);

  // this doesn't change the length or type, so can safely cast
  return c
    .slice(0, 2)
    .map((n) => Math.round(roundingFactor * n) / roundingFactor) as gj.Coordinate;
}
// simplify array of coordinates via Douglas-Peucker algorithm
export function douglasPeucker(
  coords: gj.Coordinate[],
  precisionMeters: number,
): gj.Coordinate[] {
  if (coords.length < 2) return coords.slice();
  // find the point that is farthest from the line segment defined by the endpoints
  const lineSeg: [gj.Coordinate, gj.Coordinate] = [
    coords[0],
    coords[coords.length - 1],
  ];
  let maxDist = 0;
  let maxIndex = 0;
  for (let i: number = 0; i < coords.length; i++) {
    const dist = distanceToLineSeg(coords[i], lineSeg);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  // if the farthest point is beyond the threshold, add it and recurse
  if (maxDist > precisionMeters) {
    return [
      ...douglasPeucker(coords.slice(0, maxIndex + 1), precisionMeters),
      ...douglasPeucker(coords.slice(maxIndex), precisionMeters).slice(1),
    ];
  }
  return lineSeg;
}
function removeDuplicateCoordinates(
  coords: gj.Coordinate[],
  precisionMeters: number,
): gj.Coordinate[] {
  if (coords.length < 2) return coords;
  const res = [coords[0]];
  // add intermediate coordinates only if they deviate significantly from last coordinate
  for (let i: number = 1; i < coords.length - 1; i++) {
    if (distance(res[res.length - 1], coords[i]) >= precisionMeters) {
      res.push(coords[i]);
    }
  }
  res.push(coords[coords.length - 1]);
  // further simplify by removing coordinates that are close to the line segments defined by remaining coordinates
  return douglasPeucker(res, precisionMeters);
}
function simplifyPoint(p: gj.Point, precisionMeters: number): gj.Point {
  const { coordinates, ...rest } = p;
  return {
    ...rest,
    coordinates: simplifyCoordinate(coordinates, precisionMeters),
  };
}
function simplifyMultiPoint(
  p: gj.MultiPoint,
  precisionMeters: number,
): gj.MultiPoint {
  const { coordinates, ...rest } = p;
  return {
    ...rest,
    coordinates: removeDuplicateCoordinates(
      coordinates.map((c) => simplifyCoordinate(c, precisionMeters)),
      precisionMeters,
    ),
  };
}
function simplifyLineString(
  p: gj.LineString,
  precisionMeters: number,
): gj.LineString {
  const { coordinates, ...rest } = p;
  // TODO simplify more by removing points according to Douglas-Peucker algorithm
  return {
    ...rest,
    coordinates: removeDuplicateCoordinates(
      coordinates.map((c) => simplifyCoordinate(c, precisionMeters)),
      precisionMeters,
    ),
  };
}
function simplifyMultiLineString(
  p: gj.MultiLineString,
  precisionMeters: number,
): gj.MultiLineString {
  const { coordinates, ...rest } = p;
  // TODO simplify more by removing points according to Douglas-Peucker algorithm
  return {
    ...rest,
    coordinates: coordinates.map((c) =>
      removeDuplicateCoordinates(
        c.map((d) => simplifyCoordinate(d, precisionMeters)),
        precisionMeters,
      ),
    ),
  };
}
function simplifyPolygon(p: gj.Polygon, precisionMeters: number): gj.Polygon {
  const { coordinates, ...rest } = p;
  // TODO simplify more by removing points according to Douglas-Peucker algorithm
  return {
    ...rest,
    coordinates: coordinates.map((c) =>
      removeDuplicateCoordinates(
        c.map((d) => simplifyCoordinate(d, precisionMeters)),
        precisionMeters,
      ),
    ),
  };
}
function simplifyMultiPolygon(
  p: gj.MultiPolygon,
  precisionMeters: number,
): gj.MultiPolygon {
  const { coordinates, ...rest } = p;
  // TODO simplify more by removing points according to Douglas-Peucker algorithm
  return {
    ...rest,
    coordinates: coordinates.map((b) =>
      b.map((c) =>
        removeDuplicateCoordinates(
          c.map((d) => simplifyCoordinate(d, precisionMeters)),
          precisionMeters,
        ),
      ),
    ),
  };
}
// simplify the geometry a Feature
export function simplify(f: gj.Feature, precisionMeters: number): gj.Feature {
  switch (f.geometry.type) {
    case gj.GeometryType.Point:
      return {
        ...f,
        geometry: simplifyPoint(f.geometry as gj.Point, precisionMeters),
      };
    case gj.GeometryType.MultiPoint:
      return {
        ...f,
        geometry: simplifyMultiPoint(
          f.geometry as gj.MultiPoint,
          precisionMeters,
        ),
      };
    case gj.GeometryType.LineString:
      return {
        ...f,
        geometry: simplifyLineString(
          f.geometry as gj.LineString,
          precisionMeters,
        ),
      };
    case gj.GeometryType.MultiLineString:
      return {
        ...f,
        geometry: simplifyMultiLineString(
          f.geometry as gj.MultiLineString,
          precisionMeters,
        ),
      };
    case gj.GeometryType.Polygon:
      return {
        ...f,
        geometry: simplifyPolygon(f.geometry as gj.Polygon, precisionMeters),
      };
    case gj.GeometryType.MultiPolygon:
      return {
        ...f,
        geometry: simplifyMultiPolygon(
          f.geometry as gj.MultiPolygon,
          precisionMeters,
        ),
      };
    // TODO case GeometryCollection
  }
  return f;
}

// Get the novelty score of the geometry of a Feature.
// Novelty is a measure of how repetitive a path is.
// A straight line has novelty 1, as it never goes near any of its previous points.
// An out and back has novelty 0, as every single point is repeated later.
// A perfect circle has novelty 0.2895. Other loops, lollipops will have less.
// TODO need to split long segments into short ones before calculating?
export function pathNovelty(f: gj.Feature): number {
  if (f.geometry.type == gj.GeometryType.LineString) {
    const points = f.geometry.coordinates as gj.LineStringCoordinates;

    const cumulativeDistance = points.reduce<number[]>(
      (acc, curr, idx, arr) =>
        idx === 0
          ? [...acc, 0]
          : [...acc, acc[acc.length - 1] + distance(curr, arr[idx - 1])],
      [],
    );

    const distanceGrid = points.map((pt1, i) =>
      points.map(
        (pt2, j) => (i === j ? 0 : distance(pt1, pt2)), // TODO this is calculating twice as much as needed
      ),
    );

    const noveltyPerPoint = points.map((pt1, i) =>
      points.reduce(
        (acc, pt2, j) =>
          Math.min(
            acc,
            i === j || cumulativeDistance[i] - cumulativeDistance[j] === 0
              ? Infinity
              : distanceGrid[i][j] /
              Math.abs(cumulativeDistance[i] - cumulativeDistance[j]),
          ),
        Infinity,
      ),
    );

    const avgNovelty =
      noveltyPerPoint.reduce((acc, curr) => acc + curr, 0) /
      noveltyPerPoint.length;
    return avgNovelty;
  }
  return 0;
}
