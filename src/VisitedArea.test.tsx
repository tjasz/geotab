import React, { useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { DataContext, DataContextType } from "./dataContext";
import { Feature, FeatureType, GeometryType } from "./geojson-types";
import VisitedAreaPanel from "./VisitedAreaPanel";
import VisitedAreaOverlay, { VisitedAreaLayer } from "./VisitedAreaOverlay";
import { VisitedArea, areaTileBounds } from "./visited-area";

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
  expect(screen.getAllByRole("option")).toHaveLength(17);
  expect(within(screen.getByRole("list", { name: "Largest contiguous clusters" })).getAllByRole("listitem"))
    .toHaveLength(1);
  expect(screen.getByText("1 tile")).toBeInTheDocument();
  expect(screen.getByText("Tiles visited: 1 / 4 (25%)")).toBeInTheDocument();
  fireEvent.change(zoom, { target: { value: "17" } });
  expect(screen.getByText("Tiles visited: 1 / 17,179,869,184 (0.00000000582%)")).toBeInTheDocument();
  view.rerender(<PanelHarness show={false} />);
  view.rerender(<PanelHarness />);
  expect(screen.getByRole("combobox")).toHaveValue("17");
  expect(screen.getByText("1 tile")).toBeInTheDocument();
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
  expect(within(screen.getByRole("list", { name: "Largest non-overlapping squares" }))
    .getAllByRole("link").map((link) => link.textContent))
    .toEqual(Array(5).fill("1 x 1 (1 tile)"));
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
    yards: new Map([[1, []], [2, []]]),
    squares: new Map([
      [1, [{ side: 1, bounds: areaTileBounds(0, 0, 1) }]],
      [2, [{ side: 1, bounds: areaTileBounds(0, 0, 2) }]],
    ]),
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
  const canvasContext = { fillStyle: "", fillRect: jest.fn(), clearRect: jest.fn() };
  const originalGetContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "getContext")!;
  const area: VisitedArea = {
    zoom: 2,
    yards: new Map([[2, []], [17, []]]),
    squares: new Map([[2, [{ side: 1, bounds: areaTileBounds(0, 1, 2) }]], [17, []]]),
    clusters: new Map([[2, [{ size: 1, bounds: areaTileBounds(0, 1, 2) }]], [17, []]]),
    tiles: new Map([
      [2, new Map([[0, new Map([[1, true]])]])],
      [17, new Map()],
    ]),
  };

  beforeEach(() => {
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
    const yard = { size: 16, bounds: { west: -122, east: -121, north: 48, south: 47 } };
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
});
