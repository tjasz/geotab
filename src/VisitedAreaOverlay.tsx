import { useContext, useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { DataContext } from "./dataContext";
import { areaTileBounds, VisitedArea } from "./visited-area";

export class VisitedAreaLayer extends L.GridLayer {
  constructor(private area: Pick<VisitedArea, "tiles" | "zoom">, private map: L.Map) {
    super({ pane: "overlayPane", zIndex: 300 });
  }

  createTile(coords: L.Coords) {
    const canvas = document.createElement("canvas");
    const size = this.getTileSize();
    canvas.width = size.x;
    canvas.height = size.y;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Area overlay requires a canvas 2D context.");
    ctx.fillStyle = "#00000080";
    ctx.fillRect(0, 0, size.x, size.y);
    const origin = L.point(coords.x * size.x, coords.y * size.y);
    const northwest = this.map.unproject(origin, coords.z);
    const southeast = this.map.unproject(origin.add(size), coords.z);
    const columns = this.area.tiles.get(this.area.zoom);

    for (const [x, rows] of columns ?? []) {
      const column = areaTileBounds(x, 0, this.area.zoom);
      if (column.east <= northwest.lng || column.west >= southeast.lng) continue;
      for (const y of rows.keys()) {
        const bounds = areaTileBounds(x, y, this.area.zoom);
        if (bounds.north <= southeast.lat || bounds.south >= northwest.lat) continue;
        const topLeft = this.map.project([bounds.north, bounds.west], coords.z).subtract(origin);
        const bottomRight = this.map.project([bounds.south, bounds.east], coords.z).subtract(origin);
        ctx.clearRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
      }
    }
    return canvas;
  }
}

export default function VisitedAreaOverlay() {
  const map = useMap();
  const visitedArea = useContext(DataContext)?.visitedArea;
  const tiles = visitedArea?.tiles;
  const zoom = visitedArea?.zoom;
  const focusedCluster = visitedArea?.focusedCluster;

  useEffect(() => {
    if (!tiles || zoom === undefined) return;
    const layer = new VisitedAreaLayer({ tiles, zoom }, map);
    layer.addTo(map);
    layer.getContainer()!.style.pointerEvents = "none";
    return () => { map.removeLayer(layer); };
  }, [map, tiles, zoom]);

  useEffect(() => {
    if (!focusedCluster) return;
    const { west, east, north, south } = focusedCluster.bounds;
    map.fitBounds([[south, west], [north, east]], { padding: [16, 16] });
  }, [map, focusedCluster]);

  return null;
}
