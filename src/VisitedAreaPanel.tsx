import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DataContext } from "./dataContext";
import { analyseVisitedArea, AREA_ZOOMS } from "./visited-area";

export default function VisitedAreaPanel() {
  const context = useContext(DataContext);
  const [completed, setCompleted] = useState<number>();
  const [error, setError] = useState<string>();
  const controller = useRef<AbortController>();
  const data = context?.data;
  const visitedArea = context?.visitedArea;
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
    setCompleted(undefined);
    setError(undefined);
    return () => controller.current?.abort();
  }, [data]);

  if (!context) return null;
  const { setVisitedArea } = context;
  const analyse = async () => {
    const run = new AbortController();
    controller.current = run;
    setError(undefined);
    setCompleted(0);
    try {
      const tiles = await analyseVisitedArea(context.data, setCompleted, run.signal);
      if (!run.signal.aborted) setVisitedArea({ tiles, zoom: 1 });
    } catch (reason) {
      if (!run.signal.aborted) {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
    } finally {
      if (!run.signal.aborted) setCompleted(undefined);
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
              onChange={(event) => setVisitedArea({ ...visitedArea, zoom: Number(event.target.value) })}
            >
              {AREA_ZOOMS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </label>
          <p>
            Tiles visited: {visitedTileCount.toLocaleString()} / {(4 ** visitedArea.zoom).toLocaleString()}
            {" "}({(100 * visitedTileCount / 4 ** visitedArea.zoom).toLocaleString(undefined, { maximumSignificantDigits: 3 })}%)
          </p>
        </>
      ) : (
        <button type="button" disabled={completed !== undefined} onClick={analyse}>
          Analyse
        </button>
      )}
      {completed !== undefined && (
        <div role="status">
          <progress aria-label="Area analysis progress" value={completed} max={Math.max(1, context.data.length)} />
          {" "}{completed} / {context.data.length} features
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
