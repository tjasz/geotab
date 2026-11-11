import { useContext, useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { DataContext } from "./dataContext";
import { areaTileBounds, VisitedArea } from "./visited-area";

export class VisitedAreaLayer extends L.GridLayer {
  constructor(private area: Pick<VisitedArea, "tiles" | "zoom" | "clusters" | "squares" | "yards" | "rectangles">, private map: L.Map) {
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

    const strokeBounds = ({ west, east, north, south }: ReturnType<typeof areaTileBounds>) => {
      const topLeft = this.map.project([north, west], coords.z).subtract(origin);
      const bottomRight = this.map.project([south, east], coords.z).subtract(origin);
      ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    };
    const labels = new Map<string, { x: number; y: number; texts: string[] }>();
    const addLabel = (x: number, y: number, text: string) => {
      const key = `${x},${y}`;
      let label = labels.get(key);
      if (!label) {
        label = { x: (x + 0.5) * tilePixels - origin.x, y: (y + 0.5) * tilePixels - origin.y, texts: [] };
        labels.set(key, label);
      }
      label.texts.push(text);
    };
    const addBoundsLabel = (bounds: ReturnType<typeof areaTileBounds>, text: string) => {
      const southeast = this.map.project([bounds.south, bounds.east], coords.z);
      addLabel(Math.round(southeast.x / tilePixels) - 1, Math.round(southeast.y / tilePixels) - 1, text);
    };
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "#000040ff";
    for (const [index, rectangle] of (this.area.rectangles.get(this.area.zoom) ?? []).slice(0, 5).entries()) {
      strokeBounds(rectangle.bounds);
      addBoundsLabel(rectangle.bounds, `R${index + 1}: ${(rectangle.width * rectangle.height).toLocaleString()} (${rectangle.width.toLocaleString()} x ${rectangle.height.toLocaleString()})`);
    }

    ctx.strokeStyle = "#400000ff";
    for (const [index, square] of (this.area.squares.get(this.area.zoom) ?? []).slice(0, 5).entries()) {
      strokeBounds(square.bounds);
      addBoundsLabel(square.bounds, `S${index + 1}: ${(square.side ** 2).toLocaleString()} (${square.side.toLocaleString()} x ${square.side.toLocaleString()})`);
    }

    ctx.strokeStyle = "#004000ff";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (const [index, yard] of (this.area.yards.get(this.area.zoom) ?? []).slice(0, 5).entries()) {
      let labelX = -1;
      let labelY = -1;
      for (const [x1, y1, x2, y2] of yard.outline) {
        if (y1 === y2 && (y1 > labelY || (y1 === labelY && Math.max(x1, x2) > labelX))) {
          labelX = Math.max(x1, x2);
          labelY = y1;
        }
        const left = Math.min(x1, x2) * tilePixels - origin.x;
        const right = Math.max(x1, x2) * tilePixels - origin.x;
        const top = Math.min(y1, y2) * tilePixels - origin.y;
        const bottom = Math.max(y1, y2) * tilePixels - origin.y;
        if (right < -2 || left > size.x + 2 || bottom < -2 || top > size.y + 2) continue;
        ctx.moveTo(x1 * tilePixels - origin.x, y1 * tilePixels - origin.y);
        ctx.lineTo(x2 * tilePixels - origin.x, y2 * tilePixels - origin.y);
      }
      if (labelX >= 0) addLabel(labelX - 1, labelY - 1, `Y${index + 1}: ${yard.size.toLocaleString()}`);
    }
    ctx.stroke();
    for (const [index, cluster] of (this.area.clusters.get(this.area.zoom) ?? []).slice(0, 5).entries()) {
      addLabel(cluster.labelTile.x, cluster.labelTile.y, `C${index + 1}: ${cluster.size.toLocaleString()}`);
    }
    if (labels.size) {
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const { x, y, texts } of labels.values()) {
        texts.forEach((text, index) => {
          const centerY = y + (index - (texts.length - 1) / 2) * 30;
          const halfWidth = ctx.measureText(text).width / 2 + 14;
          if (x + halfWidth < 0 || x - halfWidth > size.x || centerY + 14 < 0 || centerY - 14 > size.y) return;
          // Draw on every intersecting canvas so pills remain seamless across tile boundaries.
          ctx.beginPath();
          ctx.arc(x + halfWidth - 14, centerY, 14, -Math.PI / 2, Math.PI / 2);
          ctx.arc(x - halfWidth + 14, centerY, 14, Math.PI / 2, 3 * Math.PI / 2);
          ctx.closePath();
          ctx.fillStyle = "#ffffffcc";
          ctx.fill();
          ctx.fillStyle = "#000000";
          ctx.fillText(text, x, centerY);
        });
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
  const focusedArea = visitedArea?.focusedArea;
  const clusters = visitedArea?.clusters;
  const squares = visitedArea?.squares;
  const yards = visitedArea?.yards;
  const rectangles = visitedArea?.rectangles;
  const overlayVisible = visitedArea?.overlayVisible !== false;

  useEffect(() => {
    if (!overlayVisible || !tiles || zoom === undefined || !clusters || !squares || !yards || !rectangles) return;
    const layer = new VisitedAreaLayer({ tiles, zoom, clusters, squares, yards, rectangles }, map);
    layer.addTo(map);
    layer.getContainer()!.style.pointerEvents = "none";
    return () => { map.removeLayer(layer); };
  }, [map, tiles, zoom, clusters, squares, yards, rectangles, overlayVisible]);

  useEffect(() => {
    if (!focusedArea) return;
    const { west, east, north, south } = focusedArea.bounds;
    map.fitBounds([[south, west], [north, east]], { padding: [16, 16] });
  }, [map, focusedArea]);

  return null;
}
