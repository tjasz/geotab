import * as gj from "./geojson-types";
import { douglasPeucker } from "./geojson-calc";

const MAX_AREA_ZOOM = 17;
export const AREA_ZOOMS = Array.from({ length: MAX_AREA_ZOOM }, (_, i) => i + 1);
export const MAX_MERCATOR_LATITUDE = Math.atan(Math.sinh(Math.PI)) * 180 / Math.PI;
export type VisitedTiles = Map<number, Map<number, Map<number, true>>>;
export type VisitedCluster = { size: number; bounds: ReturnType<typeof areaTileBounds> };
export type VisitedAreaResults = { tiles: VisitedTiles; clusters: Map<number, VisitedCluster[]> };
export type VisitedArea = VisitedAreaResults & { zoom: number; focusedCluster?: VisitedCluster };
export type AnalysisProgress = { phase: "features" | "clusters"; completed: number; total: number };

function checkCancelled(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Analysis cancelled", "AbortError");
}

const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

type ProjectedPoint = { x: number; y: number };

function projectCoordinate([longitude, latitude]: gj.Coordinate): ProjectedPoint {
  if (
    !Number.isFinite(longitude) || !Number.isFinite(latitude) ||
    longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90
  ) {
    throw new Error("Area analysis requires coordinates within longitude -180 to 180 and latitude -90 to 90.");
  }
  const clampedLatitude = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
  const radians = clampedLatitude * Math.PI / 180;
  const projectedY = (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2;
  return {
    x: (longitude + 180) / 360,
    y: Math.max(0, Math.min(1, projectedY)),
  };
}

function projectedTile(point: ProjectedPoint, zoom: number) {
  const size = 2 ** zoom;
  return {
    x: Math.min(size - 1, Math.floor(point.x * size)),
    y: Math.min(size - 1, Math.floor(point.y * size)),
  };
}

export function areaTile(coordinate: gj.Coordinate, zoom: number) {
  return projectedTile(projectCoordinate(coordinate), zoom);
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

function* linePoints(coordinates: gj.Coordinate[]): Generator<ProjectedPoint> {
  if (!coordinates.length) return;
  const size = 2 ** MAX_AREA_ZOOM;
  let start = projectCoordinate(coordinates[0]);
  yield start;
  for (let i = 1; i < coordinates.length; i++) {
    const end = projectCoordinate(coordinates[i]);
    const dx = (end.x - start.x) * size;
    const dy = (end.y - start.y) * size;
    const x = start.x * size;
    const y = start.y * size;
    let boundaryX = dx > 0 ? Math.floor(x) + 1 : Math.ceil(x) - 1;
    let boundaryY = dy > 0 ? Math.floor(y) + 1 : Math.ceil(y) - 1;
    let previous = 0;
    while (previous < 1) {
      const crossingX = dx === 0 ? Infinity : (boundaryX - x) / dx;
      const crossingY = dy === 0 ? Infinity : (boundaryY - y) / dy;
      const next = Math.min(1, crossingX, crossingY);
      // Sample inside every crossed tile, including arbitrarily short corner crossings.
      const fraction = (previous + next) / 2;
      yield {
        x: start.x + (end.x - start.x) * fraction,
        y: start.y + (end.y - start.y) * fraction,
      };
      if (crossingX <= next) boundaryX += Math.sign(dx);
      if (crossingY <= next) boundaryY += Math.sign(dy);
      previous = next;
    }
    yield end;
    start = end;
  }
}

function* geometryPoints(geometry: gj.Geometry | gj.GeometryCollection): Generator<ProjectedPoint> {
  if (geometry.type === gj.GeometryType.GeometryCollection) {
    for (const child of (geometry as gj.GeometryCollection).geometries) {
      yield* geometryPoints(child);
    }
    return;
  }
  function* coordinates(value: unknown): Generator<ProjectedPoint> {
    if (!Array.isArray(value)) {
      throw new Error("Invalid geometry coordinates.");
    }
    if (typeof value[0] === "number") {
      yield projectCoordinate(value);
    } else if (
      geometry.type !== gj.GeometryType.MultiPoint &&
      Array.isArray(value[0]) && typeof value[0][0] === "number"
    ) {
      yield* linePoints(value as gj.Coordinate[]);
    } else {
      for (const child of value) yield* coordinates(child);
    }
  }
  yield* coordinates((geometry as gj.Geometry).coordinates);
}

export async function analyseVisitedArea(
  features: gj.Feature[],
  onProgress: (progress: AnalysisProgress) => void,
  signal: AbortSignal,
): Promise<VisitedAreaResults> {
  const tiles: VisitedTiles = new Map(AREA_ZOOMS.map((z) => [z, new Map()]));
  checkCancelled(signal);
  onProgress({ phase: "features", completed: 0, total: features.length });
  await yieldToBrowser();
  let lastYield = performance.now();
  for (let i = 0; i < features.length; i++) {
    checkCancelled(signal);
    const feature = { ...features[i], geometry: simplifiedGeometry(features[i].geometry) };
    for (const point of geometryPoints(feature.geometry)) {
      for (const [z, columns] of tiles) {
        const { x, y } = projectedTile(point, z);
        let rows = columns.get(x);
        if (!rows) {
          rows = new Map();
          columns.set(x, rows);
        }
        rows.set(y, true);
      }
      if (performance.now() - lastYield >= 8) {
        await yieldToBrowser();
        checkCancelled(signal);
        lastYield = performance.now();
      }
    }
    onProgress({ phase: "features", completed: i + 1, total: features.length });
    if (performance.now() - lastYield >= 8) {
      await yieldToBrowser();
      lastYield = performance.now();
    }
  }
  const clusters = await findTileClusters(tiles, onProgress, signal);
  return { tiles, clusters };
}

export async function findTileClusters(
  tiles: VisitedTiles,
  onProgress: (progress: AnalysisProgress) => void,
  signal: AbortSignal,
): Promise<Map<number, VisitedCluster[]>> {
  checkCancelled(signal);
  const result = new Map<number, VisitedCluster[]>();
  const progress = (completed: number) => onProgress({ phase: "clusters", completed, total: tiles.size });
  progress(0);
  await yieldToBrowser();
  let lastYield = performance.now();
  for (const [zoom, columns] of tiles) {
    checkCancelled(signal);
    const size = 2 ** zoom;
    const seen = new Set<number>();
    const clusters: VisitedCluster[] = [];
    for (const [x, rows] of columns) {
      for (const y of rows.keys()) {
        const key = x * size + y;
        if (seen.has(key)) continue;
        const queue = [key];
        seen.add(key);
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        for (let head = 0; head < queue.length; head++) {
          const currentX = Math.floor(queue[head] / size);
          const currentY = queue[head] % size;
          minX = Math.min(minX, currentX);
          maxX = Math.max(maxX, currentX);
          minY = Math.min(minY, currentY);
          maxY = Math.max(maxY, currentY);
          for (const [nextX, nextY] of [
            [currentX - 1, currentY], [currentX + 1, currentY],
            [currentX, currentY - 1], [currentX, currentY + 1],
          ]) {
            if (nextX < 0 || nextX >= size || nextY < 0 || nextY >= size) continue;
            const nextKey = nextX * size + nextY;
            if (!seen.has(nextKey) && columns.get(nextX)?.has(nextY)) {
              seen.add(nextKey);
              queue.push(nextKey);
            }
          }
          if (performance.now() - lastYield >= 8) {
            await yieldToBrowser();
            checkCancelled(signal);
            lastYield = performance.now();
          }
        }
        const northwest = areaTileBounds(minX, minY, zoom);
        const southeast = areaTileBounds(maxX, maxY, zoom);
        clusters.push({
          size: queue.length,
          bounds: {
            west: northwest.west, north: northwest.north,
            east: southeast.east, south: southeast.south,
          },
        });
      }
    }
    result.set(zoom, clusters.sort((a, b) => b.size - a.size));
    progress(result.size);
  }
  checkCancelled(signal);
  return result;
}
