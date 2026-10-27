import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DataContext } from "./dataContext";
import { analyseVisitedArea, AnalysisProgress, AREA_ZOOMS } from "./visited-area";

export default function VisitedAreaPanel() {
  const context = useContext(DataContext);
  const [progress, setProgress] = useState<AnalysisProgress>();
  const [error, setError] = useState<string>();
  const controller = useRef<AbortController>();
  const data = context?.data;
  const visitedArea = context?.visitedArea;
  const clusters = visitedArea?.clusters.get(visitedArea.zoom) ?? [];
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
              onChange={(event) => setVisitedArea({ ...visitedArea, zoom: Number(event.target.value), focusedCluster: undefined })}
            >
              {AREA_ZOOMS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </label>
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
                      setVisitedArea({ ...visitedArea, focusedCluster: { ...cluster } });
                    }}
                  >
                    {cluster.size.toLocaleString()} {cluster.size === 1 ? "tile" : "tiles"}
                  </a>
                </li>
              ))}
            </ol>
          ) : <p>No visited clusters.</p>}
        </>
      ) : (
        <button type="button" disabled={progress !== undefined} onClick={analyse}>
          Analyse
        </button>
      )}
      {progress && (
        <div role="status">
          <progress aria-label="Area analysis progress" value={progress.completed} max={Math.max(1, progress.total)} />
          {" "}{progress.phase === "clusters" ? "Finding clusters: " : ""}
          {progress.completed} / {progress.total} {progress.phase === "clusters" ? "zoom levels" : "features"}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
