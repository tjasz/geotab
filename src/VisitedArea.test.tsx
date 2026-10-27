import React, { useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { DataContext, DataContextType } from "./dataContext";
import { Feature, FeatureType, GeometryType } from "./geojson-types";
import VisitedAreaPanel from "./VisitedAreaPanel";
import VisitedAreaOverlay, { VisitedAreaLayer } from "./VisitedAreaOverlay";
import { VisitedArea, VisitedYard, areaTileBounds } from "./visited-area";

jest.mock("react-leaflet", () => ({ useMap: jest.fn() }));

const data: Feature[] = [{
  type: FeatureType.Feature,
  properties: {},
  geometry: { type: GeometryType.Point, coordinates: [-122, 47] },
}];
const context: NonNullable<DataContextType> = {
  data,
  filteredData: data,
  filter: null,
  columns: [],
  symbology: null,
  featureListeners: { table: {}, map: {} },
  setData: jest.fn(),
  setFilter: jest.fn(),
  setDataAndFilter: jest.fn(),
  setColumns: jest.fn(),
  setSymbology: jest.fn(),
  setDetailFeature: jest.fn(),
  setFeatureListener: jest.fn(),
  setFromJson: jest.fn(),
  setVisitedArea: jest.fn(),
};

function PanelHarness({ features = data, show = true, initialArea, withMap = false }: {
  features?: Feature[];
  show?: boolean;
  initialArea?: VisitedArea;
  withMap?: boolean;
}) {
  const [visitedArea, setVisitedArea] = useState<VisitedArea | undefined>(initialArea);
  return (
    <DataContext.Provider value={{ ...context, data: features, visitedArea, setVisitedArea }}>
      {show && <VisitedAreaPanel />}
      {withMap && <VisitedAreaOverlay />}
    </DataContext.Provider>
  );
}

test("shows progress, stores analysis, and preserves zoom across panel remounts", async () => {
  const view = render(<PanelHarness />);
  fireEvent.click(screen.getByRole("button", { name: "Analyse" }));
  expect(screen.getByRole("progressbar")).toBeInTheDocument();
  expect(screen.getByRole("button")).toBeDisabled();
  const zoom = await screen.findByRole("combobox", { name: "Area zoom" });
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  expect(screen.getAllByRole("option")).toHaveLength(18);
  expect(within(screen.getByRole("list", { name: "Largest contiguous clusters" })).getAllByRole("listitem"))
    .toHaveLength(1);
  expect(screen.getByText("1 tile")).toBeInTheDocument();
  expect(screen.getByText("Tiles visited: 1 / 4 (25%)")).toBeInTheDocument();
  fireEvent.change(zoom, { target: { value: "18" } });
  expect(screen.getByText("Tiles visited: 1 / 68,719,476,736 (0.00000000146%)")).toBeInTheDocument();
  expect(screen.getByRole("switch", { name: "Show map overlay" })).toBeChecked();
  fireEvent.click(screen.getByRole("switch", { name: "Show map overlay" }));
  view.rerender(<PanelHarness show={false} />);
  view.rerender(<PanelHarness />);
  expect(screen.getByRole("combobox")).toHaveValue("18");
  expect(screen.getByText("1 tile")).toBeInTheDocument();
  expect(screen.getByRole("switch", { name: "Show map overlay" })).not.toBeChecked();
});

test("arranges statistics in a two-column grid with clusters and squares above yards and rectangles", async () => {
  render(<PanelHarness />);
  fireEvent.click(screen.getByRole("button", { name: "Analyse" }));
  await screen.findByRole("combobox", { name: "Area zoom" });
  const grid = screen.getByRole("group", { name: "Visited area statistics" });
  const sections = within(grid).getAllByRole("region");
  expect(sections.map((section) => within(section).getByRole("heading").textContent)).toEqual([
    "Largest contiguous clusters",
    "Largest non-overlapping squares",
    "Largest yards",
    "Largest non-overlapping rectangles",
  ]);
  expect(grid).toHaveStyle({ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" });
  expect(within(sections[0]).getByRole("link", { name: "1 tile" })).toBeInTheDocument();
  expect(within(sections[1]).getByText("No visited squares.")).toBeInTheDocument();
  expect(within(sections[2]).getByText("No visited yards.")).toBeInTheDocument();
  expect(within(sections[3]).getByText("No visited rectangles.")).toBeInTheDocument();
});

test("shows only the five largest clusters and updates them for the selected zoom", async () => {
  const coordinates = [1, 6, 2, 5, 3, 7, 4].flatMap((size, row) =>
    Array.from({ length: size }, (_, x) => {
      const bounds = areaTileBounds(x, row * 2, 5);
      return [(bounds.west + bounds.east) / 2, (bounds.north + bounds.south) / 2];
    }),
  );
  render(<PanelHarness features={[{
    ...data[0],
    geometry: { type: GeometryType.MultiPoint, coordinates },
  }]} />);
  fireEvent.click(screen.getByRole("button"));
  const zoom = await screen.findByRole("combobox");
  fireEvent.change(zoom, { target: { value: "5" } });
  const list = screen.getByRole("list", { name: "Largest contiguous clusters" });
  expect(within(list).getAllByRole("listitem").map((item) => item.textContent))
    .toEqual(["7 tiles", "6 tiles", "5 tiles", "4 tiles", "3 tiles"]);
  fireEvent.change(zoom, { target: { value: "17" } });
  expect(within(screen.getByRole("list", { name: "Largest contiguous clusters" })).getAllByRole("listitem").map((item) => item.textContent))
    .toEqual(["1 tile", "1 tile", "1 tile", "1 tile", "1 tile"]);
});

test("shows the top five non-overlapping squares with dimensions and counts for the selected zoom", async () => {
  const coordinates = [[0, 1], [3, 2], [6, 3], [10, 4], [15, 5], [21, 6]].flatMap(([startX, side]) =>
    Array.from({ length: side }, (_, dx) =>
      Array.from({ length: side }, (_, y) => {
        const bounds = areaTileBounds(startX + dx, y, 5);
        return [(bounds.west + bounds.east) / 2, (bounds.north + bounds.south) / 2];
      }),
    ).flat(),
  );
  render(<PanelHarness features={[{
    ...data[0],
    geometry: { type: GeometryType.MultiPoint, coordinates },
  }]} />);
  fireEvent.click(screen.getByRole("button"));
  const zoom = await screen.findByRole("combobox");
  fireEvent.change(zoom, { target: { value: "5" } });
  expect(within(screen.getByRole("list", { name: "Largest non-overlapping squares" }))
    .getAllByRole("link").map((link) => link.textContent))
    .toEqual(["6 x 6 (36 tiles)", "5 x 5 (25 tiles)", "4 x 4 (16 tiles)", "3 x 3 (9 tiles)", "2 x 2 (4 tiles)"]);
  fireEvent.change(zoom, { target: { value: "17" } });
  expect(screen.queryByRole("list", { name: "Largest non-overlapping squares" })).not.toBeInTheDocument();
  expect(screen.getByText("No visited squares.")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "1 x 1 (1 tile)" })).not.toBeInTheDocument();
});

test("shows the top five rectangles by area and updates them for the selected zoom", async () => {
  const blocks = [[0, 8, 2], [10, 6, 3], [18, 5, 3], [25, 4, 2], [31, 3, 2], [36, 2, 1], [40, 1, 1]];
  const coordinates = blocks.flatMap(([startX, width, height]) =>
    Array.from({ length: width }, (_, dx) =>
      Array.from({ length: height }, (_, dy) => {
        const bounds = areaTileBounds(startX + dx, 2 + dy, 6);
        return [(bounds.west + bounds.east) / 2, (bounds.north + bounds.south) / 2];
      }),
    ).flat(),
  );
  render(<PanelHarness features={[{
    ...data[0], geometry: { type: GeometryType.MultiPoint, coordinates },
  }]} />);
  fireEvent.click(screen.getByRole("button"));
  const zoom = await screen.findByRole("combobox");
  fireEvent.change(zoom, { target: { value: "6" } });
  expect(within(screen.getByRole("list", { name: "Largest non-overlapping rectangles" }))
    .getAllByRole("link").map((link) => link.textContent))
    .toEqual(["6 x 3 (18 tiles)", "8 x 2 (16 tiles)", "5 x 3 (15 tiles)", "4 x 2 (8 tiles)", "3 x 2 (6 tiles)"]);
  fireEvent.change(zoom, { target: { value: "17" } });
  expect(screen.queryByRole("list", { name: "Largest non-overlapping rectangles" })).not.toBeInTheDocument();
  expect(screen.getByText("No visited rectangles.")).toBeInTheDocument();
});

test("shows the five largest yards by interior tile count for the selected zoom", async () => {
  const coordinates = [[0, 3], [4, 4], [9, 5], [15, 6], [22, 7], [30, 8], [39, 9]].flatMap(([startX, side]) =>
    Array.from({ length: side }, (_, dx) =>
      Array.from({ length: side }, (_, dy) => {
        const bounds = areaTileBounds(startX + dx, 2 + dy, 6);
        return [(bounds.west + bounds.east) / 2, (bounds.north + bounds.south) / 2];
      }),
    ).flat(),
  );
  render(<PanelHarness features={[{
    ...data[0],
    geometry: { type: GeometryType.MultiPoint, coordinates },
  }]} />);
  fireEvent.click(screen.getByRole("button"));
  const zoom = await screen.findByRole("combobox");
  fireEvent.change(zoom, { target: { value: "6" } });
  expect(within(screen.getByRole("list", { name: "Largest yards" }))
    .getAllByRole("link").map((link) => link.textContent))
    .toEqual(["49 tiles", "36 tiles", "25 tiles", "16 tiles", "9 tiles"]);
  fireEvent.change(zoom, { target: { value: "17" } });
  expect(screen.queryByRole("list", { name: "Largest yards" })).not.toBeInTheDocument();
  expect(screen.getByText("No visited yards.")).toBeInTheDocument();
});

test("counts all visited rows across columns for the selected zoom only", () => {
  const visitedArea: VisitedArea = {
    zoom: 2,
    rectangles: new Map([[1, []], [2, []]]),
    yards: new Map([[1, []], [2, []]]),
    squares: new Map([[1, []], [2, []]]),
    clusters: new Map([
      [1, [{ size: 1, bounds: areaTileBounds(0, 0, 1) }]],
      [2, [{
        size: 3,
        bounds: { ...areaTileBounds(0, 0, 2), east: areaTileBounds(1, 0, 2).east, south: 0 },
      }]],
    ]),
    tiles: new Map([
      [1, new Map([[0, new Map([[0, true]])]])],
      [2, new Map([
        [0, new Map([[0, true], [1, true]])],
        [1, new Map([[0, true]])],
      ])],
    ]),
  };
  render(
    <DataContext.Provider value={{ ...context, visitedArea }}>
      <VisitedAreaPanel />
    </DataContext.Provider>,
  );
  expect(screen.getByText("Tiles visited: 3 / 16 (18.8%)")).toBeInTheDocument();
});

test("shows zero coverage for an empty analysis", async () => {
  render(<PanelHarness features={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Analyse" }));
  expect(await screen.findByText("Tiles visited: 0 / 4 (0%)")).toBeInTheDocument();
  expect(screen.getByText("No visited clusters.")).toBeInTheDocument();
  expect(screen.getByText("No visited squares.")).toBeInTheDocument();
  expect(screen.getByText("No visited yards.")).toBeInTheDocument();
  expect(screen.getByText("No visited rectangles.")).toBeInTheDocument();
});

test("reports invalid data explicitly and allows retry", async () => {
  render(<PanelHarness features={[{
    ...data[0],
    geometry: { type: GeometryType.Point, coordinates: [181, 0] },
  }]} />);
  fireEvent.click(screen.getByRole("button"));
  expect(await screen.findByRole("alert")).toHaveTextContent(/requires coordinates/);
  expect(screen.getByRole("button")).toBeEnabled();
});

test("cancels work on data change or panel unmount", async () => {
  const setVisitedArea = jest.fn();
  const view = render(
    <DataContext.Provider value={{ ...context, setVisitedArea }}>
      <VisitedAreaPanel />
    </DataContext.Provider>,
  );
  fireEvent.click(screen.getByRole("button"));
  view.rerender(
    <DataContext.Provider value={{ ...context, data: [], setVisitedArea }}>
      <VisitedAreaPanel />
    </DataContext.Provider>,
  );
  await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("button"));
  view.unmount();
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(setVisitedArea).not.toHaveBeenCalled();
});

describe("map mask", () => {
  let map: L.Map;
  type Command = ["M" | "L", number, number];
  const strokes: { color: string; width: number; dash: number[]; path: Command[]; rectangle?: number[] }[] = [];
  const canvasContext = {
    fillStyle: "", strokeStyle: "", lineWidth: 0,
    fillRect: jest.fn(), clearRect: jest.fn(), strokeRect: jest.fn(),
    setLineDash: jest.fn(), beginPath: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(), stroke: jest.fn(),
  };
  const originalGetContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "getContext")!;
  const area: VisitedArea = {
    zoom: 2,
    rectangles: new Map([[2, []], [17, []]]),
    yards: new Map([[2, []], [17, []]]),
    squares: new Map([[2, []], [17, []]]),
    clusters: new Map([[2, [{ size: 1, bounds: areaTileBounds(0, 1, 2) }]], [17, []]]),
    tiles: new Map([
      [2, new Map([[0, new Map([[1, true]])]])],
      [17, new Map()],
    ]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    strokes.length = 0;
    let dash: number[] = [];
    let path: Command[] = [];
    canvasContext.setLineDash.mockImplementation((value: number[]) => { dash = value.slice(); });
    canvasContext.beginPath.mockImplementation(() => { path = []; });
    canvasContext.moveTo.mockImplementation((x: number, y: number) => { path.push(["M", x, y]); });
    canvasContext.lineTo.mockImplementation((x: number, y: number) => { path.push(["L", x, y]); });
    canvasContext.stroke.mockImplementation(() => {
      strokes.push({ color: canvasContext.strokeStyle, width: canvasContext.lineWidth, dash, path: path.slice() });
    });
    canvasContext.strokeRect.mockImplementation((...rectangle: number[]) => {
      strokes.push({ color: canvasContext.strokeStyle, width: canvasContext.lineWidth, dash, path: [], rectangle });
    });
    const container = document.createElement("div");
    Object.defineProperties(container, {
      clientWidth: { value: 1024 },
      clientHeight: { value: 768 },
    });
    map = L.map(container).setView([0, 0], 1);
    jest.mocked(useMap).mockReturnValue(map);
    canvasContext.fillRect.mockClear();
    canvasContext.clearRect.mockClear();
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => canvasContext,
    });
  });

  afterEach(() => {
    map.remove();
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", originalGetContext);
  });

  test("shades unvisited pixels and clears visited geographic tiles using map projection", () => {
    const layer = new VisitedAreaLayer(area, map);
    const tile = layer.createTile(Object.assign(L.point(0, 0), { z: 1 }));
    expect([tile.width, tile.height]).toEqual([256, 256]);
    expect(canvasContext.fillStyle).toBe("#00000080");
    expect(canvasContext.fillRect).toHaveBeenCalledWith(0, 0, 256, 256);
    const bounds = areaTileBounds(0, 1, 2);
    const topLeft = map.project([bounds.north, bounds.west], 1);
    const bottomRight = map.project([bounds.south, bounds.east], 1);
    expect(canvasContext.clearRect).toHaveBeenCalledTimes(1);
    expect(canvasContext.clearRect).toHaveBeenCalledWith(
      topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y,
    );
    canvasContext.clearRect.mockClear();
    layer.createTile(Object.assign(L.point(1, 1), { z: 1 }));
    expect(canvasContext.clearRect).not.toHaveBeenCalled();
  });

  test("draws an opaque black 1px solid grid aligned to analysis tile boundaries", () => {
    new VisitedAreaLayer(area, map).createTile(Object.assign(L.point(0, 0), { z: 1 }));
    expect(strokes[0]).toEqual({
      color: "#000000ff", width: 1, dash: [],
      path: [
        ["M", 0.5, 0], ["L", 0.5, 256],
        ["M", 128.5, 0], ["L", 128.5, 256],
        ["M", 0, 0.5], ["L", 256, 0.5],
        ["M", 0, 128.5], ["L", 256, 128.5],
      ],
    });
  });

  test("aligns the grid and visited tile clearing at z=18", () => {
    new VisitedAreaLayer({
      ...area,
      zoom: 18,
      tiles: new Map([[18, new Map([[150000, new Map<number, true>([[100000, true]])]])]]),
    }, map).createTile(Object.assign(L.point(150000, 100000), { z: 18 }));
    expect(canvasContext.clearRect).toHaveBeenCalledTimes(1);
    const cleared = canvasContext.clearRect.mock.calls[0];
    expect(cleared[0]).toBeCloseTo(0);
    expect(cleared[1]).toBeCloseTo(0);
    expect(cleared[2]).toBeCloseTo(256);
    expect(cleared[3]).toBeCloseTo(256);
    expect(strokes[0]).toEqual({
      color: "#000000ff", width: 1, dash: [],
      path: [["M", 0.5, 0], ["L", 0.5, 256], ["M", 0, 0.5], ["L", 256, 0.5]],
    });
  });

  test("draws square outlines in opaque red with 3px width and a 6 6 dash array", () => {
    new VisitedAreaLayer({
      ...area,
      squares: new Map([[2, [{
        side: 2,
        bounds: { ...areaTileBounds(0, 0, 2), east: 0, south: 0 },
      }]]]),
    }, map).createTile(Object.assign(L.point(0, 0), { z: 1 }));
    const squareStroke = strokes.find((stroke) => stroke.rectangle);
    expect(squareStroke).toMatchObject({ color: "#400000ff", width: 3, dash: [6, 6] });
    expect(squareStroke?.rectangle?.[0]).toBeCloseTo(0);
    expect(squareStroke?.rectangle?.[1]).toBeCloseTo(0);
    expect(squareStroke?.rectangle?.[2]).toBeCloseTo(256);
    expect(squareStroke?.rectangle?.[3]).toBeCloseTo(256);
  });

  test("does not draw square or rectangle outlines when none qualify", () => {
    new VisitedAreaLayer(area, map).createTile(Object.assign(L.point(0, 0), { z: 1 }));
    expect(strokes.filter((stroke) => stroke.rectangle)).toHaveLength(0);
  });

  test("draws rectangle outlines in opaque blue with 3px width and a 6 6 dash array", () => {
    new VisitedAreaLayer({
      ...area,
      rectangles: new Map([[2, [{
        width: 3,
        height: 1,
        bounds: { ...areaTileBounds(0, 1, 2), east: areaTileBounds(2, 1, 2).east },
      }]]]),
    }, map).createTile(Object.assign(L.point(0, 0), { z: 1 }));
    const rectangleStroke = strokes.find((stroke) => stroke.rectangle);
    expect(rectangleStroke).toMatchObject({ color: "#000040ff", width: 3, dash: [6, 6] });
    expect(rectangleStroke?.rectangle?.[0]).toBeCloseTo(0);
    expect(rectangleStroke?.rectangle?.[1]).toBeCloseTo(128);
    expect(rectangleStroke?.rectangle?.[2]).toBeCloseTo(384);
    expect(rectangleStroke?.rectangle?.[3]).toBeCloseTo(128);
  });

  test("draws actual concave yard edges in opaque green with 3px width and a 3 3 dash array", () => {
    const yard: VisitedYard = {
      size: 3,
      bounds: {
        ...areaTileBounds(5, 5, 4),
        east: areaTileBounds(6, 6, 4).east,
        south: areaTileBounds(6, 6, 4).south,
      },
      outline: [
        [5, 5, 5, 6], [5, 5, 6, 5],
        [7, 5, 7, 6], [6, 5, 7, 5], [6, 6, 7, 6],
        [5, 6, 5, 7], [6, 6, 6, 7], [5, 7, 6, 7],
      ],
    };
    new VisitedAreaLayer({
      ...area, zoom: 4, yards: new Map([[4, [yard]]]),
    }, map).createTile(Object.assign(L.point(0, 0), { z: 1 }));
    const yardStroke = strokes.find((stroke) => stroke.dash.join() === "3,3");
    expect(yardStroke).toMatchObject({ color: "#004000ff", width: 3, dash: [3, 3] });
    expect(yardStroke?.path).toHaveLength(16);
    expect(yardStroke?.path).toEqual(expect.arrayContaining([
      ["M", 192, 192], ["L", 224, 192], ["M", 192, 192], ["L", 192, 224],
    ]));
    expect(yardStroke?.path).not.toContainEqual(["L", 224, 224]);
  });

  test("only outlines the top five rectangles, squares, and yards with their respective colors", () => {
    const yard: VisitedYard = {
      size: 1, bounds: areaTileBounds(0, 1, 2), outline: [[0, 1, 1, 1]],
    };
    new VisitedAreaLayer({
      ...area,
      squares: new Map([[2, Array.from({ length: 6 }, () => ({
        side: 2, bounds: { ...areaTileBounds(0, 0, 2), east: 0, south: 0 },
      }))]]),
      rectangles: new Map([[2, Array.from({ length: 6 }, () => ({
        width: 2, height: 2, bounds: { ...areaTileBounds(0, 0, 2), east: 0, south: 0 },
      }))]]),
      yards: new Map([[2, Array.from({ length: 6 }, () => yard)]]),
    }, map).createTile(Object.assign(L.point(0, 0), { z: 1 }));
    expect(strokes.filter((stroke) => stroke.rectangle && stroke.color === "#400000ff")).toHaveLength(5);
    expect(strokes.filter((stroke) => stroke.rectangle && stroke.color === "#000040ff")).toHaveLength(5);
    expect(strokes.find((stroke) => stroke.color === "#004000ff")?.path).toHaveLength(10);
    expect(strokes.filter((stroke) => stroke.rectangle).map((stroke) => stroke.color))
      .toEqual([...Array(5).fill("#000040ff"), ...Array(5).fill("#400000ff")]);
  });

  test("renders subpixel-spaced 1px tile borders without iterating over invisible lines", () => {
    new VisitedAreaLayer({ ...area, zoom: 17 }, map)
      .createTile(Object.assign(L.point(0, 0), { z: 1 }));
    expect(canvasContext.fillStyle).toBe("#000000ff");
    expect(canvasContext.fillRect).toHaveBeenCalledTimes(2);
    expect(canvasContext.fillRect).toHaveBeenLastCalledWith(0, 0, 256, 256);
    expect(strokes.filter((stroke) => stroke.width === 1)).toHaveLength(0);
  });

  test.each(["squares", "rectangles"] as const)("refreshes %s outlines when only those results change", (kind) => {
    const view = render(
      <DataContext.Provider value={{ ...context, visitedArea: area }}>
        <VisitedAreaOverlay />
      </DataContext.Provider>,
    );
    const removeLayer = jest.spyOn(map, "removeLayer");
    view.rerender(
      <DataContext.Provider value={{
        ...context,
        visitedArea: {
          ...area,
          ...(kind === "squares" ? {
            squares: new Map([[2, [{
              side: 2, bounds: { ...areaTileBounds(0, 0, 2), east: 0, south: 0 },
            }]]]),
          } : {
            rectangles: new Map([[2, [{
              width: 2, height: 2, bounds: { ...areaTileBounds(0, 0, 2), east: 0, south: 0 },
            }]]]),
          }),
        },
      }}>
        <VisitedAreaOverlay />
      </DataContext.Provider>,
    );
    expect(removeLayer).toHaveBeenCalledTimes(1);
  });

  test("cluster links fit the correct bounds, can be clicked repeatedly, and preserve the overlay", () => {
    const fitBounds = jest.spyOn(map, "fitBounds");
    const first = { size: 3, bounds: { west: -122, east: -121, north: 48, south: 47 } };
    const second = { size: 1, bounds: areaTileBounds(0, 1, 2) };
    render(<PanelHarness initialArea={{
      ...area,
      clusters: new Map([[2, [first, second]], [17, []]]),
    }} withMap />);
    const layers: L.Layer[] = [];
    map.eachLayer((layer) => layers.push(layer));
    expect(fitBounds).not.toHaveBeenCalled();
    const link = screen.getByRole("link", { name: "3 tiles" });
    expect(link).toHaveAttribute("href", "#mapview");
    fireEvent.click(link);
    expect(fitBounds).toHaveBeenLastCalledWith([[47, -122], [48, -121]], { padding: [16, 16] });
    expect(map.getBounds().contains([[47, -122], [48, -121]])).toBe(true);
    expect(map.hasLayer(layers[0])).toBe(true);
    fireEvent.click(link);
    expect(fitBounds).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("link", { name: "1 tile" }));
    expect(fitBounds).toHaveBeenCalledTimes(3);
    expect(fitBounds).toHaveBeenLastCalledWith([
      [second.bounds.south, second.bounds.west], [second.bounds.north, second.bounds.east],
    ], { padding: [16, 16] });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "17" } });
    expect(fitBounds).toHaveBeenCalledTimes(3);
  });

  test("square links fit the complete square bounds and can refocus the same square", () => {
    const fitBounds = jest.spyOn(map, "fitBounds");
    const square = {
      side: 6,
      bounds: {
        ...areaTileBounds(4, 4, 5),
        east: areaTileBounds(9, 9, 5).east,
        south: areaTileBounds(9, 9, 5).south,
      },
    };
    render(<PanelHarness initialArea={{
      ...area,
      zoom: 5,
      squares: new Map([[5, [square]]]),
    }} withMap />);
    const link = screen.getByRole("link", { name: "6 x 6 (36 tiles)" });
    expect(link).toHaveAttribute("href", "#mapview");
    expect(fitBounds).not.toHaveBeenCalled();
    fireEvent.click(link);
    const { west, east, north, south } = square.bounds;
    expect(fitBounds).toHaveBeenLastCalledWith([[south, west], [north, east]], { padding: [16, 16] });
    expect(map.getBounds().contains([[south, west], [north, east]])).toBe(true);
    fireEvent.click(link);
    expect(fitBounds).toHaveBeenCalledTimes(2);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "17" } });
    expect(fitBounds).toHaveBeenCalledTimes(2);
    expect(screen.getByText("No visited squares.")).toBeInTheDocument();
  });

  test("yard links fit the interior bounds, can refocus, and reset when changing zoom", () => {
    const fitBounds = jest.spyOn(map, "fitBounds");
    const yard = { size: 16, bounds: { west: -122, east: -121, north: 48, south: 47 }, outline: [] };
    render(<PanelHarness initialArea={{
      ...area,
      yards: new Map([[2, [yard]], [17, []]]),
    }} withMap />);
    const link = within(screen.getByRole("list", { name: "Largest yards" }))
      .getByRole("link", { name: "16 tiles" });
    expect(link).toHaveAttribute("href", "#mapview");
    expect(fitBounds).not.toHaveBeenCalled();
    fireEvent.click(link);
    expect(fitBounds).toHaveBeenLastCalledWith([[47, -122], [48, -121]], { padding: [16, 16] });
    expect(map.getBounds().contains([[47, -122], [48, -121]])).toBe(true);
    fireEvent.click(link);
    expect(fitBounds).toHaveBeenCalledTimes(2);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "17" } });
    expect(fitBounds).toHaveBeenCalledTimes(2);
    expect(screen.getByText("No visited yards.")).toBeInTheDocument();
  });

  test("rectangle links fit the full bounds even with the overlay hidden", () => {
    const fitBounds = jest.spyOn(map, "fitBounds");
    const rectangle = { width: 6, height: 3, bounds: { west: -122, east: -121, north: 48, south: 47 } };
    render(<PanelHarness initialArea={{
      ...area,
      overlayVisible: false,
      rectangles: new Map([[2, [rectangle]], [17, []]]),
    }} withMap />);
    const link = within(screen.getByRole("list", { name: "Largest non-overlapping rectangles" }))
      .getByRole("link", { name: "6 x 3 (18 tiles)" });
    expect(link).toHaveAttribute("href", "#mapview");
    expect(fitBounds).not.toHaveBeenCalled();
    fireEvent.click(link);
    expect(fitBounds).toHaveBeenLastCalledWith([[47, -122], [48, -121]], { padding: [16, 16] });
    expect(map.getBounds().contains([[47, -122], [48, -121]])).toBe(true);
    fireEvent.click(link);
    expect(fitBounds).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("switch", { name: "Show map overlay" })).not.toBeChecked();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "17" } });
    expect(fitBounds).toHaveBeenCalledTimes(2);
    expect(screen.getByText("No visited rectangles.")).toBeInTheDocument();
  });

  test("updates the overlay on zoom changes, passes clicks through, and removes it on reset", () => {
    const layers = () => {
      const result: VisitedAreaLayer[] = [];
      map.eachLayer((layer) => {
        if (layer instanceof VisitedAreaLayer) result.push(layer);
      });
      return result;
    };
    const view = render(
      <DataContext.Provider value={{ ...context, visitedArea: area }}>
        <VisitedAreaOverlay />
      </DataContext.Provider>,
    );
    expect(layers()[0].getContainer()).toHaveStyle({ pointerEvents: "none" });
    const oldLayer = layers()[0];
    view.rerender(
      <DataContext.Provider value={{ ...context, visitedArea: { ...area, zoom: 17 } }}>
        <VisitedAreaOverlay />
      </DataContext.Provider>,
    );
    expect(layers()[0]).not.toBe(oldLayer);
    expect(layers()).toHaveLength(1);
    view.rerender(
      <DataContext.Provider value={context}>
        <VisitedAreaOverlay />
      </DataContext.Provider>,
    );
    expect(layers()).toHaveLength(0);
  });

  test("overlay switch removes and restores all drawing without clearing analysis or disabling links", () => {
    const fitBounds = jest.spyOn(map, "fitBounds");
    const layers = () => {
      const result: VisitedAreaLayer[] = [];
      map.eachLayer((layer) => {
        if (layer instanceof VisitedAreaLayer) result.push(layer);
      });
      return result;
    };
    render(<PanelHarness initialArea={area} withMap />);
    const toggle = screen.getByRole("switch", { name: "Show map overlay" });
    expect(toggle).toBeChecked();
    expect(layers()).toHaveLength(1);
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(layers()).toHaveLength(0);
    expect(screen.getByText("Tiles visited: 1 / 16 (6.25%)")).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("list", { name: "Largest contiguous clusters" })).getByRole("link"));
    expect(fitBounds).toHaveBeenCalledTimes(1);
    expect(layers()).toHaveLength(0);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "17" } });
    expect(toggle).not.toBeChecked();
    expect(layers()).toHaveLength(0);
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(layers()).toHaveLength(1);
    expect(screen.getByRole("combobox")).toHaveValue("17");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    expect(screen.getByText("Tiles visited: 1 / 16 (6.25%)")).toBeInTheDocument();
    expect(screen.getByText("No visited squares.")).toBeInTheDocument();
  });
});
