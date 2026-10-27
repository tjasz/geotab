import * as gj from "./geojson-types";
import { douglasPeucker } from "./geojson-calc";

export const AREA_ZOOMS = Array.from({ length: 17 }, (_, i) => i + 1);
export const MAX_MERCATOR_LATITUDE = Math.atan(Math.sinh(Math.PI)) * 180 / Math.PI;
export type VisitedTiles = Map<number, Map<number, Map<number, true>>>;
export type VisitedArea = { tiles: VisitedTiles; zoom: number };

export function areaTile([longitude, latitude]: gj.Coordinate, zoom: number) {
  if (
    !Number.isFinite(longitude) || !Number.isFinite(latitude) ||
    longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90
  ) {
    throw new Error("Area analysis requires coordinates within longitude -180 to 180 and latitude -90 to 90.");
  }
  const size = 2 ** zoom;
  const clampedLatitude = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
  const radians = clampedLatitude * Math.PI / 180;
  const projectedY = (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2;
  return {
    x: Math.min(size - 1, Math.floor(((longitude + 180) / 360) * size)),
    y: Math.max(0, Math.min(size - 1, Math.floor(projectedY * size))),
  };
}

export function areaTileBounds(x: number, y: number, zoom: number) {
  const size = 2 ** zoom;
  const latitude = (row: number) => Math.atan(Math.sinh(Math.PI * (1 - 2 * row / size))) * 180 / Math.PI;
  return {
    west: (x / size) * 360 - 180,
    east: ((x + 1) / size) * 360 - 180,
    north: latitude(y),
    south: latitude(y + 1),
  };
}

function simplifiedGeometry(geometry: gj.Geometry): gj.Geometry;
function simplifiedGeometry(geometry: gj.Geometry | gj.GeometryCollection): gj.Geometry | gj.GeometryCollection;
function simplifiedGeometry(geometry: gj.Geometry | gj.GeometryCollection): gj.Geometry | gj.GeometryCollection {
  const line = (coordinates: gj.Coordinate[]) =>
    douglasPeucker(coordinates, 30).map((point) => point.slice());
  switch (geometry.type) {
    case gj.GeometryType.Point:
      return { ...geometry, coordinates: (geometry as gj.Point).coordinates.slice() };
    case gj.GeometryType.MultiPoint:
      return { ...geometry, coordinates: (geometry as gj.MultiPoint).coordinates.map((point) => point.slice()) };
    case gj.GeometryType.LineString:
      return { ...geometry, coordinates: line((geometry as gj.LineString).coordinates) };
    case gj.GeometryType.MultiLineString:
    case gj.GeometryType.Polygon:
      return { ...geometry, coordinates: (geometry as gj.Polygon).coordinates.map(line) };
    case gj.GeometryType.MultiPolygon:
      return { ...geometry, coordinates: (geometry as gj.MultiPolygon).coordinates.map((polygon) => polygon.map(line)) };
    case gj.GeometryType.GeometryCollection:
      return { ...geometry, geometries: (geometry as gj.GeometryCollection).geometries.map((child) => simplifiedGeometry(child)) };
    default:
      throw new Error(`Unsupported geometry type: ${geometry.type}`);
  }
}

function* geometryPoints(geometry: gj.Geometry | gj.GeometryCollection): Generator<gj.Coordinate> {
  if (geometry.type === gj.GeometryType.GeometryCollection) {
    for (const child of (geometry as gj.GeometryCollection).geometries) {
      yield* geometryPoints(child);
    }
    return;
  }
  function* coordinates(value: unknown): Generator<gj.Coordinate> {
    if (!Array.isArray(value)) {
      throw new Error("Invalid geometry coordinates.");
    }
    if (typeof value[0] === "number") {
      yield value;
    } else {
      for (const child of value) yield* coordinates(child);
    }
  }
  yield* coordinates((geometry as gj.Geometry).coordinates);
}

export async function analyseVisitedArea(
  features: gj.Feature[],
  onProgress: (completed: number) => void,
  signal: AbortSignal,
): Promise<VisitedTiles> {
  const tiles: VisitedTiles = new Map(AREA_ZOOMS.map((z) => [z, new Map()]));
  const checkCancelled = () => {
    if (signal.aborted) throw new DOMException("Analysis cancelled", "AbortError");
  };
  const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  onProgress(0);
  await yieldToBrowser();
  let lastYield = performance.now();
  for (let i = 0; i < features.length; i++) {
    checkCancelled();
    const feature = { ...features[i], geometry: simplifiedGeometry(features[i].geometry) };
    for (const point of geometryPoints(feature.geometry)) {
      for (const [z, columns] of tiles) {
        const { x, y } = areaTile(point, z);
        let rows = columns.get(x);
        if (!rows) {
          rows = new Map();
          columns.set(x, rows);
        }
        rows.set(y, true);
      }
      if (performance.now() - lastYield >= 8) {
        await yieldToBrowser();
        checkCancelled();
        lastYield = performance.now();
      }
    }
    onProgress(i + 1);
    if (performance.now() - lastYield >= 8) {
      await yieldToBrowser();
      lastYield = performance.now();
    }
  }
  checkCancelled();
  return tiles;
}
