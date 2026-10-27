import { analyseVisitedArea, areaTile, areaTileBounds, AREA_ZOOMS } from "./visited-area";
import { Feature, FeatureType, Geometry, GeometryType } from "./geojson-types";

const feature = (type: GeometryType, coordinates: Geometry["coordinates"]): Feature => ({
  type: FeatureType.Feature,
  properties: {},
  geometry: { type, coordinates } as Geometry,
});
const analyse = (features: Feature[]) =>
  analyseVisitedArea(features, () => {}, new AbortController().signal);

test("uses equal latitude quadrants with north-to-south Y and clamps world edges", () => {
  expect(areaTile([-180, 90], 1)).toEqual({ x: 0, y: 0 });
  expect(areaTile([180, -90], 1)).toEqual({ x: 1, y: 1 });
  expect(areaTile([0, 0], 1)).toEqual({ x: 1, y: 1 });
  expect(areaTile([0, 60], 2)).toEqual({ x: 2, y: 0 });
  expect(areaTile([180, -90], 17)).toEqual({ x: 131071, y: 131071 });
  expect(areaTileBounds(2, 0, 2)).toEqual({ west: 0, east: 90, north: 90, south: 45 });
});

test.each([[NaN, 0], [0, Infinity], [181, 0], [0, -91], []])(
  "rejects invalid coordinates %p",
  (...point) => expect(() => areaTile(point, 1)).toThrow(/requires coordinates/),
);

test("creates maps at every zoom, deduplicates points, and reports progress", async () => {
  const progress = jest.fn();
  const tiles = await analyseVisitedArea(
    [feature(GeometryType.Point, [-122, 47]), feature(GeometryType.Point, [-122, 47])],
    progress,
    new AbortController().signal,
  );
  expect([...tiles.keys()]).toEqual(AREA_ZOOMS);
  for (const z of AREA_ZOOMS) {
    const { x, y } = areaTile([-122, 47], z);
    expect(tiles.get(z)).toEqual(new Map([[x, new Map([[y, true]])]]));
  }
  expect(progress.mock.calls).toEqual([[0], [1], [2]]);
});

test.each([
  [0.00026, false],
  [0.00028, true],
])("simplifies at 30 meters without changing source coordinates (%p)", async (latitude, retained) => {
  const source = feature(GeometryType.LineString, [[0, 0], [0.01, latitude], [0.02, 0]]);
  const before = JSON.stringify(source);
  const tiles = await analyse([source]);
  const { x, y } = areaTile([0.01, latitude], 17);
  expect(tiles.get(17)?.get(x)?.has(y) ?? false).toBe(retained);
  expect(JSON.stringify(source)).toBe(before);
});

test("handles all geometry types and collections without connecting separate parts", async () => {
  const points = [[-170, 80], [-120, 50], [-60, 10], [10, -20], [70, -50], [130, -70]];
  const sources = [
    feature(GeometryType.Point, points[0]),
    feature(GeometryType.MultiPoint, [points[1], points[2], points[3]]),
    feature(GeometryType.LineString, [points[4]]),
    feature(GeometryType.MultiLineString, [[points[5]], [points[0]]]),
    feature(GeometryType.Polygon, [[points[1]], [points[2]]]),
    feature(GeometryType.MultiPolygon, [[[points[3]]], [[points[4]]]]),
    {
      type: FeatureType.Feature,
      properties: {},
      geometry: { type: GeometryType.GeometryCollection, geometries: [{ type: GeometryType.Point, coordinates: points[5] }] },
    },
  ];
  const tiles = await analyse(sources);
  for (const point of points) {
    const { x, y } = areaTile(point, 17);
    expect(tiles.get(17)?.get(x)?.get(y)).toBe(true);
  }
  expect([...tiles.get(17)!.values()].reduce((sum, rows) => sum + rows.size, 0)).toBe(points.length);
});

test("does not mark segment interiors visited", async () => {
  const tiles = await analyse([feature(GeometryType.LineString, [[-100, 0], [100, 0]])]);
  const { x, y } = areaTile([0, 0], 17);
  expect(tiles.get(17)?.get(x)?.has(y)).not.toBe(true);
});

test("initializes empty results and supports cancellation", async () => {
  const tiles = await analyse([]);
  expect(tiles.size).toBe(17);
  expect([...tiles.values()].every((columns) => columns.size === 0)).toBe(true);
  const controller = new AbortController();
  controller.abort();
  await expect(analyseVisitedArea([feature(GeometryType.Point, [0, 0])], () => {}, controller.signal))
    .rejects.toMatchObject({ name: "AbortError" });
});
