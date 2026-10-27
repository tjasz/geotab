import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FormControlLabel, Switch } from "@mui/material";
import { DataContext } from "./dataContext";
import { analyseVisitedArea, AnalysisProgress, AREA_ZOOMS } from "./visited-area";

const PROGRESS_LABELS: Record<AnalysisProgress["phase"], string> = {
  features: "",
  clusters: "Finding clusters: ",
  squares: "Finding squares: ",
  yards: "Finding yards: ",
  rectangles: "Finding rectangles: ",
};

export default function VisitedAreaPanel() {
  const context = useContext(DataContext);
  const [progress, setProgress] = useState<AnalysisProgress>();
  const [error, setError] = useState<string>();
  const controller = useRef<AbortController>();
  const data = context?.data;
  const visitedArea = context?.visitedArea;
  const clusters = visitedArea?.clusters.get(visitedArea.zoom) ?? [];
  const squares = visitedArea?.squares.get(visitedArea.zoom) ?? [];
  const yards = visitedArea?.yards.get(visitedArea.zoom) ?? [];
  const rectangles = visitedArea?.rectangles.get(visitedArea.zoom) ?? [];
  const visitedTileCount = useMemo(() => {
    let count = 0;
    if (visitedArea) {
      for (const rows of visitedArea.tiles.get(visitedArea.zoom)?.values() ?? []) {
        count += rows.size;
      }
    }
    return count;
  }, [visitedArea]);

  useEffect(() => {
    setProgress(undefined);
    setError(undefined);
    return () => controller.current?.abort();
  }, [data]);

  if (!context) return null;
  const { setVisitedArea } = context;
  const analyse = async () => {
    const run = new AbortController();
    controller.current = run;
    setError(undefined);
    setProgress({ phase: "features", completed: 0, total: context.data.length });
    try {
      const results = await analyseVisitedArea(context.data, setProgress, run.signal);
      if (!run.signal.aborted) setVisitedArea({ ...results, zoom: 1 });
    } catch (reason) {
      if (!run.signal.aborted) {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
    } finally {
      if (!run.signal.aborted) setProgress(undefined);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      {visitedArea ? (
        <>
          <label>
            Area zoom{" "}
            <select
              value={visitedArea.zoom}
              onChange={(event) => setVisitedArea({ ...visitedArea, zoom: Number(event.target.value), focusedArea: undefined })}
            >
              {AREA_ZOOMS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </label>
          <FormControlLabel
            label="Show map overlay"
            control={
              <Switch
                checked={visitedArea.overlayVisible !== false}
                onChange={(event) => setVisitedArea({ ...visitedArea, overlayVisible: event.target.checked })}
                inputProps={{ role: "switch" }}
              />
            }
          />
          <p>
            Tiles visited: {visitedTileCount.toLocaleString()} / {(4 ** visitedArea.zoom).toLocaleString()}
            {" "}({(100 * visitedTileCount / 4 ** visitedArea.zoom).toLocaleString(undefined, { maximumSignificantDigits: 3 })}%)
          </p>
          <h3>Largest contiguous clusters</h3>
          {clusters.length ? (
            <ol aria-label="Largest contiguous clusters">
              {clusters.slice(0, 5).map((cluster, index) => (
                <li key={index}>
                  <a
                    href="#mapview"
                    onClick={(event) => {
                      event.preventDefault();
                      setVisitedArea({ ...visitedArea, focusedArea: { bounds: cluster.bounds } });
                    }}
                  >
                    {cluster.size.toLocaleString()} {cluster.size === 1 ? "tile" : "tiles"}
                  </a>
                </li>
              ))}
            </ol>
          ) : <p>No visited clusters.</p>}
          <h3>Largest non-overlapping squares</h3>
          {squares.length ? (
            <ol aria-label="Largest non-overlapping squares">
              {squares.map((square, index) => (
                <li key={index}>
                  <a
                    href="#mapview"
                    onClick={(event) => {
                      event.preventDefault();
                      setVisitedArea({ ...visitedArea, focusedArea: { bounds: square.bounds } });
                    }}
                  >
                    {square.side.toLocaleString()} x {square.side.toLocaleString()}
                    {" "}({(square.side ** 2).toLocaleString()} {square.side === 1 ? "tile" : "tiles"})
                  </a>
                </li>
              ))}
            </ol>
          ) : <p>No visited squares.</p>}
          <h3>Largest non-overlapping rectangles</h3>
          {rectangles.length ? (
            <ol aria-label="Largest non-overlapping rectangles">
              {rectangles.map((rectangle, index) => (
                <li key={index}>
                  <a
                    href="#mapview"
                    onClick={(event) => {
                      event.preventDefault();
                      setVisitedArea({ ...visitedArea, focusedArea: { bounds: rectangle.bounds } });
                    }}
                  >
                    {rectangle.width.toLocaleString()} x {rectangle.height.toLocaleString()}
                    {" "}({(rectangle.width * rectangle.height).toLocaleString()} tiles)
                  </a>
                </li>
              ))}
            </ol>
          ) : <p>No visited rectangles.</p>}
          <h3>Largest yards</h3>
          {yards.length ? (
            <ol aria-label="Largest yards">
              {yards.slice(0, 5).map((yard, index) => (
                <li key={index}>
                  <a
                    href="#mapview"
                    onClick={(event) => {
                      event.preventDefault();
                      setVisitedArea({ ...visitedArea, focusedArea: { bounds: yard.bounds } });
                    }}
                  >
                    {yard.size.toLocaleString()} {yard.size === 1 ? "tile" : "tiles"}
                  </a>
                </li>
              ))}
            </ol>
          ) : <p>No visited yards.</p>}
        </>
      ) : (
        <button type="button" disabled={progress !== undefined} onClick={analyse}>
          Analyse
        </button>
      )}
      {progress && (
        <div role="status">
          <progress aria-label="Area analysis progress" value={progress.completed} max={Math.max(1, progress.total)} />
          {" "}{PROGRESS_LABELS[progress.phase]}
          {progress.completed} / {progress.total} {progress.phase === "features" ? "features" : "zoom levels"}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
