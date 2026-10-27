import L from "leaflet";
import { analyseVisitedArea, areaTile, areaTileBounds, AREA_ZOOMS, findTileClusters, MAX_MERCATOR_LATITUDE, VisitedTiles } from "./visited-area";
import { Feature, FeatureType, Geometry, GeometryType } from "./geojson-types";

const feature = (type: GeometryType, coordinates: Geometry["coordinates"]): Feature => ({
  type: FeatureType.Feature,
  properties: {},
  geometry: { type, coordinates } as Geometry,
});
const analyse = (features: Feature[]) =>
  analyseVisitedArea(features, () => {}, new AbortController().signal).then((result) => result.tiles);

test("uses Web Mercator XYZ tiles with north-to-south Y and clamps world edges", () => {
  expect(areaTile([-180, 90], 1)).toEqual({ x: 0, y: 0 });
  expect(areaTile([180, -90], 1)).toEqual({ x: 1, y: 1 });
  expect(areaTile([0, 0], 1)).toEqual({ x: 1, y: 1 });
  expect(areaTile([0, 60], 2)).toEqual({ x: 2, y: 1 });
  expect(areaTile([0, -60], 2)).toEqual({ x: 2, y: 2 });
  expect(areaTile([180, -90], 17)).toEqual({ x: 131071, y: 131071 });
  const bounds = areaTileBounds(2, 0, 2);
  expect(bounds.west).toBe(0);
  expect(bounds.east).toBe(90);
  expect(bounds.north).toBeCloseTo(85.0511287798066, 10);
  expect(bounds.south).toBeCloseTo(66.51326044311186, 10);
});

test("clamps polar coordinates to the Web Mercator limits at every zoom", () => {
  for (const z of AREA_ZOOMS) {
    for (const latitude of [MAX_MERCATOR_LATITUDE, 86, 90]) {
      expect(areaTile([0, latitude], z).y).toBe(0);
      expect(areaTile([0, -latitude], z).y).toBe(2 ** z - 1);
    }
    expect(areaTileBounds(0, 0, z).north).toBeCloseTo(MAX_MERCATOR_LATITUDE, 10);
    expect(areaTileBounds(0, 2 ** z - 1, z).south).toBeCloseTo(-MAX_MERCATOR_LATITUDE, 10);
  }
});

test("matches Leaflet's Web Mercator projection and tile bounds at every zoom", () => {
  for (const z of AREA_ZOOMS) {
    for (const [longitude, latitude] of [[-122, 47], [12, 80], [140, -70], [-170, -10]]) {
      const pixels = L.CRS.EPSG3857.latLngToPoint(L.latLng(latitude, longitude), z);
      const tile = areaTile([longitude, latitude], z);
      expect(tile).toEqual({ x: Math.floor(pixels.x / 256), y: Math.floor(pixels.y / 256) });
      const bounds = areaTileBounds(tile.x, tile.y, z);
      const northwest = L.CRS.EPSG3857.latLngToPoint(L.latLng(bounds.north, bounds.west), z);
      const southeast = L.CRS.EPSG3857.latLngToPoint(L.latLng(bounds.south, bounds.east), z);
      expect(northwest.x / 256).toBeCloseTo(tile.x, 7);
      expect(northwest.y / 256).toBeCloseTo(tile.y, 7);
      expect(southeast.x / 256).toBeCloseTo(tile.x + 1, 7);
      expect(southeast.y / 256).toBeCloseTo(tile.y + 1, 7);
    }
  }
});

test.each([[NaN, 0], [0, Infinity], [181, 0], [0, -91], []])(
  "rejects invalid coordinates %p",
  (...point) => expect(() => areaTile(point, 1)).toThrow(/requires coordinates/),
);

test("creates maps at every zoom, deduplicates points, and reports progress", async () => {
  const progress = jest.fn();
  const { tiles, clusters } = await analyseVisitedArea(
    [feature(GeometryType.Point, [-122, 47]), feature(GeometryType.Point, [-122, 47])],
    progress,
    new AbortController().signal,
  );
  expect([...tiles.keys()]).toEqual(AREA_ZOOMS);
  for (const z of AREA_ZOOMS) {
    const { x, y } = areaTile([-122, 47], z);
    expect(tiles.get(z)).toEqual(new Map([[x, new Map([[y, true]])]]));
    expect(clusters.get(z)?.map((cluster) => cluster.size)).toEqual([1]);
  }
  expect(progress.mock.calls.slice(0, 3)).toEqual([
    [{ phase: "features", completed: 0, total: 2 }],
    [{ phase: "features", completed: 1, total: 2 }],
    [{ phase: "features", completed: 2, total: 2 }],
  ]);
  expect(progress.mock.calls.slice(3)).toEqual(
    Array.from({ length: 18 }, (_, completed) => [{ phase: "clusters", completed, total: 17 }]),
  );
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

test.each([0, 47, 85, -85])("visits every tile along straight east-west tracks at latitude %p", async (latitude) => {
  const start = [-0.02, latitude];
  const end = [0.02, latitude];
  const source = feature(GeometryType.LineString, [start, [0, latitude], end]);
  const before = JSON.stringify(source);
  const tiles = await analyse([source]);
  for (const z of AREA_ZOOMS) {
    const first = areaTile(start, z);
    const last = areaTile(end, z);
    for (let x = first.x; x <= last.x; x++) {
      expect(tiles.get(z)?.get(x)?.has(first.y)).toBe(true);
    }
    expect(tiles.get(z)?.size).toBe(last.x - first.x + 1);
  }
  expect(JSON.stringify(source)).toBe(before);
});

test.each([1, -1])("visits every tile along north-south tracks near 85 degrees (direction %p)", async (direction) => {
  const points = [[0, 84.999], [0, 85.001]];
  if (direction < 0) points.reverse();
  const tiles = await analyse([feature(GeometryType.LineString, points)]);
  const first = areaTile(points[0], 17);
  const last = areaTile(points[1], 17);
  const rows = tiles.get(17)?.get(first.x);
  for (let y = Math.min(first.y, last.y); y <= Math.max(first.y, last.y); y++) {
    expect(rows?.has(y)).toBe(true);
  }
  expect(rows?.size).toBe(Math.abs(first.y - last.y) + 1);
});

test.each([false, true])("covers tiny diagonal corner crossings without gaps (reversed %p)", async (reversed) => {
  const coordinate = (x: number, y: number) => {
    const point = L.CRS.EPSG3857.pointToLatLng(L.point(x * 256, y * 256), 17);
    return [point.lng, point.lat];
  };
  const points = [coordinate(100.1, 100.1001), coordinate(102.9, 102.9001)];
  if (reversed) points.reverse();
  const tiles = await analyse([feature(GeometryType.LineString, points)]);
  expect(tiles.get(17)).toEqual(new Map([
    [100, new Map([[100, true], [101, true]])],
    [101, new Map([[101, true], [102, true]])],
    [102, new Map([[102, true]])],
  ]));
});

test("does not connect independent lines or polygon rings during sampling", async () => {
  const left = [[-0.02, 47], [-0.01, 47]];
  const right = [[0.01, 47], [0.02, 47]];
  for (const type of [GeometryType.MultiLineString, GeometryType.Polygon]) {
    const tiles = await analyse([feature(type, [left, right])]);
    const middle = areaTile([0, 47], 17);
    expect(tiles.get(17)?.get(middle.x)?.has(middle.y)).not.toBe(true);
    for (const line of [left, right]) {
      const first = areaTile(line[0], 17);
      const last = areaTile(line[1], 17);
      for (let x = first.x; x <= last.x; x++) {
        expect(tiles.get(17)?.get(x)?.has(first.y)).toBe(true);
      }
    }
  }
});

test("samples repeated coordinates and world-edge segments without leaving the grid", async () => {
  const points = [[180, 90], [180, 90], [179.99, 90]];
  const tiles = await analyse([feature(GeometryType.LineString, points)]);
  const first = areaTile(points[2], 17);
  expect(tiles.get(17)?.size).toBe(131072 - first.x);
  for (const rows of tiles.get(17)!.values()) {
    expect([...rows.keys()]).toEqual([0]);
  }
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

describe("contiguous tile clusters", () => {
  const tilesAt = (zoom: number, points: number[][]): VisitedTiles => {
    const columns = new Map<number, Map<number, true>>();
    for (const [x, y] of points) {
      let rows = columns.get(x);
      if (!rows) {
        rows = new Map();
        columns.set(x, rows);
      }
      rows.set(y, true);
    }
    return new Map([[zoom, columns]]);
  };
  const clusters = async (tiles: VisitedTiles) => {
    const result = await findTileClusters(tiles, () => {}, new AbortController().signal);
    return new Map([...result].map(([zoom, entries]) => [zoom, entries.map((cluster) => cluster.size)]));
  };

  test("BFS joins horizontal and vertical neighbors, excludes diagonals, and counts cycles once", async () => {
    const points = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 2], [4, 2], [7, 7]];
    const tiles = tilesAt(3, points);
    expect(await clusters(tiles)).toEqual(new Map([[3, [5, 2, 1]]]));
    for (const [x, y] of points) {
      expect(tiles.get(3)?.get(x)?.get(y)).toBe(true);
    }
  });

  test("finds every cluster and sorts by numeric size descending", async () => {
    const sizes = [1, 6, 2, 5, 3, 7, 4];
    const points = sizes.flatMap((size, row) =>
      Array.from({ length: size }, (_, x) => [x, row * 2]),
    );
    expect(await clusters(tilesAt(5, points))).toEqual(new Map([[5, [7, 6, 5, 4, 3, 2, 1]]]));
  });

  test("keeps zoom levels separate and does not wrap across world boundaries", async () => {
    const tiles = new Map([
      ...tilesAt(1, [[0, 0], [1, 0], [0, 1], [1, 1]]),
      ...tilesAt(17, [[0, 0], [131071, 0], [0, 131071], [131071, 131071]]),
    ]);
    expect(await clusters(tiles)).toEqual(new Map([[1, [4]], [17, [1, 1, 1, 1]]]));
  });

  test("returns empty cluster lists for empty zoom levels", async () => {
    const { clusters } = await analyseVisitedArea([], () => {}, new AbortController().signal);
    expect([...clusters.keys()]).toEqual(AREA_ZOOMS);
    expect([...clusters.values()].every((entries) => entries.length === 0)).toBe(true);
  });

  test("stores cluster results as part of feature analysis", async () => {
    const coordinates = [[100, 100], [101, 100], [101, 101], [110, 110]].map(([x, y]) => {
      const bounds = areaTileBounds(x, y, 17);
      return [(bounds.west + bounds.east) / 2, (bounds.north + bounds.south) / 2];
    });
    const { clusters } = await analyseVisitedArea(
      [feature(GeometryType.MultiPoint, coordinates)], () => {}, new AbortController().signal,
    );
    expect(clusters.get(17)?.map((cluster) => cluster.size)).toEqual([3, 1]);
    expect(clusters.get(1)?.map((cluster) => cluster.size)).toEqual([1]);
  });

  test("retains the full tile extents with the correct clusters after sorting", async () => {
    const result = await findTileClusters(
      tilesAt(2, [[0, 0], [1, 1], [2, 1], [1, 2], [2, 2]]),
      () => {},
      new AbortController().signal,
    );
    expect(result.get(2)).toEqual([
      {
        size: 4,
        bounds: {
          west: -90, east: 90,
          north: areaTileBounds(1, 1, 2).north,
          south: areaTileBounds(2, 2, 2).south,
        },
      },
      { size: 1, bounds: areaTileBounds(0, 0, 2) },
    ]);
  });

  test("supports cancellation during the clustering phase", async () => {
    const controller = new AbortController();
    const progress = jest.fn(() => controller.abort());
    await expect(findTileClusters(tilesAt(3, [[0, 0]]), progress, controller.signal))
      .rejects.toMatchObject({ name: "AbortError" });
    expect(progress).toHaveBeenCalledTimes(1);
    expect(progress).toHaveBeenCalledWith({ phase: "clusters", completed: 0, total: 1 });
  });
});
