import { useContext, useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { DataContext } from "./dataContext";
import { areaTileBounds, VisitedArea } from "./visited-area";

export class VisitedAreaLayer extends L.GridLayer {
  constructor(private area: Pick<VisitedArea, "tiles" | "zoom" | "squares" | "yards">, private map: L.Map) {
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
    const tilePixels = this.map.getPixelWorldBounds(coords.z).getSize().x / 2 ** this.area.zoom;
    ctx.strokeStyle = "#000000ff";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    if (tilePixels <= 1) {
      // Subpixel-spaced 1px grid lines cover the entire canvas.
      ctx.fillStyle = "#000000ff";
      ctx.fillRect(0, 0, size.x, size.y);
    } else {
      ctx.beginPath();
      for (let x = Math.ceil(origin.x / tilePixels); x * tilePixels < origin.x + size.x; x++) {
        const pixelX = Math.round(x * tilePixels - origin.x) + 0.5;
        ctx.moveTo(pixelX, 0);
        ctx.lineTo(pixelX, size.y);
      }
      for (let y = Math.ceil(origin.y / tilePixels); y * tilePixels < origin.y + size.y; y++) {
        const pixelY = Math.round(y * tilePixels - origin.y) + 0.5;
        ctx.moveTo(0, pixelY);
        ctx.lineTo(size.x, pixelY);
      }
      ctx.stroke();
    }

    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    for (const square of (this.area.squares.get(this.area.zoom) ?? []).slice(0, 5)) {
      const { west, east, north, south } = square.bounds;
      const topLeft = this.map.project([north, west], coords.z).subtract(origin);
      const bottomRight = this.map.project([south, east], coords.z).subtract(origin);
      ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    }

    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (const yard of (this.area.yards.get(this.area.zoom) ?? []).slice(0, 5)) {
      for (const [x1, y1, x2, y2] of yard.outline) {
        const left = Math.min(x1, x2) * tilePixels - origin.x;
        const right = Math.max(x1, x2) * tilePixels - origin.x;
        const top = Math.min(y1, y2) * tilePixels - origin.y;
        const bottom = Math.max(y1, y2) * tilePixels - origin.y;
        if (right < -2 || left > size.x + 2 || bottom < -2 || top > size.y + 2) continue;
        ctx.moveTo(x1 * tilePixels - origin.x, y1 * tilePixels - origin.y);
        ctx.lineTo(x2 * tilePixels - origin.x, y2 * tilePixels - origin.y);
      }
    }
    ctx.stroke();
    return canvas;
  }
}

export default function VisitedAreaOverlay() {
  const map = useMap();
  const visitedArea = useContext(DataContext)?.visitedArea;
  const tiles = visitedArea?.tiles;
  const zoom = visitedArea?.zoom;
  const focusedArea = visitedArea?.focusedArea;
  const squares = visitedArea?.squares;
  const yards = visitedArea?.yards;
  const overlayVisible = visitedArea?.overlayVisible !== false;

  useEffect(() => {
    if (!overlayVisible || !tiles || zoom === undefined || !squares || !yards) return;
    const layer = new VisitedAreaLayer({ tiles, zoom, squares, yards }, map);
    layer.addTo(map);
    layer.getContainer()!.style.pointerEvents = "none";
    return () => { map.removeLayer(layer); };
  }, [map, tiles, zoom, squares, yards, overlayVisible]);

  useEffect(() => {
    if (!focusedArea) return;
    const { west, east, north, south } = focusedArea.bounds;
    map.fitBounds([[south, west], [north, east]], { padding: [16, 16] });
  }, [map, focusedArea]);

  return null;
}
