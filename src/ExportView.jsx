import React, { useContext, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { buffer, union } from "@turf/turf";
import { DataContext } from "./dataContext";
import { painter } from "./painter"

const featureOptions = ["all", "filtered", "selected"];
const formatOptions = ["geojson", "geojson+css", "geojson+simplestyle", "geojson+caltopo"];
export function ExportView() {
  const context = useContext(DataContext);
  const [featureSelection, setFeatureSelection] = useState(featureOptions[0]);
  const [formatSelection, setFormatSelection] = useState(formatOptions[0]);
  const [doBuffer, setDoBuffer] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const isActive = (feature) => {
    const status = feature.properties["geotab:selectionStatus"];
    return status !== undefined && !status.includes("inactive");
  };

  const createBuffer = (features) => {
    const bufferDistances = [0.1, 0.2, 0.4, 0.8, 1.6];
    const bufferFeatures = bufferDistances.map((dist) =>
      features
        .slice(1)
        .reduce(
          (cumulativeBuffer, feature) =>
            union(
              cumulativeBuffer,
              buffer(feature, dist, { units: "kilometers" }),
              { properties: { bufferDistance: dist } },
            ),
          buffer(features[0], dist, { units: "kilometers" }),
        ),
    );
    return {
      type: "FeatureCollection",
      features: bufferFeatures,
    };
  };

  const createExportFeature = (
    includeHidden,
    filterFunc = (f) => true,
    buffer = false,
    format = formatOptions[0],
  ) => {
    const features = (
      includeHidden ? context.data : context.filteredData
    ).filter(filterFunc);

    // don't style the new buffer features - there is no definition for their style
    if (buffer) {
      return createBuffer(features);
    }

    // add SimpleStyle properties from the symbology
    const painterInstance = painter(context.symbology);
    const styledFeatures = formatSelection === "geojson" ? features : features.map(f => {
      const style = painterInstance(f);
      switch (formatSelection) {
        case "geojson+css":
          // TODO pass styling for markers
          return {
            ...f,
            style: {
              stroke: style.stroke ? style.color : "none",
              "stroke-width": style.weight,
              "stroke-opacity": style.opacity,
              "stroke-linecap": style.lineCap,
              "stroke-dasharray": style.dashArray,
              "stroke-dashoffset": style.dashOffset,
              fill: style.fill ? style.fillColor : "none",
              "fill-opacity": style.fillOpacity,
              "fill-rule": style.fillRule,
            }
          };
        case "geojson+simplestyle":
          return {
            ...f, properties: {
              // TODO pass the following SimpleStyle props: marker-size, marker-symbol, marker-color
              ...f.properties,
              pattern: style.pattern,
              stroke: style.stroke ? style.color : "none",
              "stroke-width": style.weight,
              "stroke-opacity": style.opacity,
              "stroke-linecap": style.lineCap,
              "stroke-dasharray": style.dashArray,
              "stroke-dashoffset": style.dashOffset,
              fill: style.fill ? style.fillColor : "none",
              "fill-opacity": style.fillOpacity,
              "fill-rule": style.fillRule,
            }
          }
        case "geojson+caltopo":
          return {
            ...f, properties: {
              // TODO pass the following CalTopo props: marker-rotation, marker-size as integer, marker-symbol, marker-color
              ...f.properties,
              pattern: style.pattern,
              stroke: style.stroke ? style.color : "none",
              "stroke-width": style.weight,
              "stroke-opacity": style.opacity,
              "stroke-linecap": style.lineCap,
              "stroke-dasharray": style.dashArray,
              "stroke-dashoffset": style.dashOffset,
              fill: style.fill ? style.fillColor : "none",
              "fill-opacity": style.fillOpacity,
              "fill-rule": style.fillRule,
            }
          }
      }
    });

    return {
      type: "FeatureCollection",
      features: styledFeatures,
      geotabMetadata: {
        columns: context.columns,
        filter: context.filter,
        symbology: context.symbology,
      },
    };
  };

  const exportToFile = (featureCollection) => {
    const textContent = JSON.stringify(featureCollection);
    const file = new Blob([textContent], { type: "text/plain" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(file);
    downloadLink.download = "geotabExport.json";
    document.body.appendChild(downloadLink); // Required for this to work in FireFox
    downloadLink.click();
  };

  const doExport = () => {
    // set parameters from export option
    var includeHidden = true;
    var filter = (f) => true;
    switch (featureSelection) {
      case "all":
        break;
      case "filtered":
        includeHidden = false;
        break;
      case "selected":
        includeHidden = false;
        filter = isActive;
        break;
    }

    const featureCollection = createExportFeature(
      includeHidden,
      filter,
      doBuffer,
      formatSelection,
    );
    exportToFile(featureCollection);
    setIsLoading(false);
  };

  return (
    <div id="exportView">
      <h3>Export</h3>
      <select
        defaultValue={featureSelection}
        onChange={e => setFeatureSelection(e.target.value)}
      >
        {featureOptions.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <select
        defaultValue={formatSelection}
        onChange={e => setFormatSelection(e.target.value)}
      >
        {formatOptions.map(o => <option key={o} value={o}>{o}</option>)}
      </select>


      <input type="checkbox" id="buffer" name="buffer" checked={doBuffer} onChange={() => setDoBuffer(!doBuffer)} />
      <label htmlFor="buffer">Buffer</label>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <button
          onClick={() => {
            setIsLoading(true);
            setTimeout(doExport, 0);
          }}
        >
          Export
        </button>
      )}
    </div>
  );
}