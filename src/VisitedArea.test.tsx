import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

function PanelHarness({ features = data, show = true }: { features?: Feature[]; show?: boolean }) {
  const [visitedArea, setVisitedArea] = useState<VisitedArea>();
  return (
    <DataContext.Provider value={{ ...context, data: features, visitedArea, setVisitedArea }}>
      {show && <VisitedAreaPanel />}
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
  expect(screen.getByText("Tiles visited: 1 / 4 (25%)")).toBeInTheDocument();
  fireEvent.change(zoom, { target: { value: "17" } });
  expect(screen.getByText("Tiles visited: 1 / 17,179,869,184 (0.00000000582%)")).toBeInTheDocument();
  view.rerender(<PanelHarness show={false} />);
  view.rerender(<PanelHarness />);
  expect(screen.getByRole("combobox")).toHaveValue("17");
});

test("counts all visited rows across columns for the selected zoom only", () => {
  const visitedArea: VisitedArea = {
    zoom: 2,
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
    tiles: new Map([
      [2, new Map([[0, new Map([[1, true]])]])],
      [17, new Map()],
    ]),
  };

  beforeEach(() => {
    map = L.map(document.createElement("div")).setView([0, 0], 1);
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
