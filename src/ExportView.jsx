import React, { useContext, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import { buffer, combine, union } from "@turf/turf";
import { DataContext } from "./dataContext";
import { painter } from "./painter"

export function ExportView(props) {
  const context = useContext(DataContext);
  const [exportOption, setExportOption] = useState("all");
  const [includeStyle, setIncludeStyle] = useState(false);
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
    includeStyle = false,
  ) => {
    const features = (
      includeHidden ? context.data : context.filteredData
    ).filter(filterFunc);

    // add SimpleStyle properties from the symbology
    const painterInstance = painter(context.symbology);
    const styledFeatures = includeStyle ? features.map(f => {
      const style = painterInstance(f);
      return {
        ...f, properties: {
          // TODO pass the following SimpleStyle props: marker-size, marker-symbol, marker-color
          // TODO pass the following CalTopo props: marker-rotation, marker-size as integer
          // TODO consider passing GeoJSON+CSS format
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
    }) : features;

    return buffer
      ? createBuffer(styledFeatures)
      : {
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
    var buffer = false;
    switch (exportOption) {
      case "all":
        break;
      case "filtered":
        includeHidden = false;
        break;
      case "selected":
        includeHidden = false;
        filter = isActive;
        break;
      case "bufferAll":
        buffer = true;
        break;
      case "bufferFiltered":
        includeHidden = false;
        buffer = true;
        break;
      case "bufferSelected":
        includeHidden = false;
        filter = isActive;
        buffer = true;
        break;
    }

    const featureCollection = createExportFeature(
      includeHidden,
      filter,
      buffer,
      includeStyle,
    );
    exportToFile(featureCollection);
    setIsLoading(false);
  };

  return (
    <div id="exportView">
      <h3>Export</h3>
      <select
        defaultValue={exportOption}
        onChange={(ev) => setExportOption(ev.target.value)}
      >
        <option value="all">All</option>
        <option value="filtered">Filtered</option>
        <option value="selected">Selected</option>
        <option value="bufferAll">Buffer (All)</option>
        <option value="bufferFiltered">Buffer (Filtered)</option>
        <option value="bufferSelected">Buffer (Selected)</option>
      </select>
      <input type="checkbox" id="includeStyle" name="includeStyle" checked={includeStyle} onChange={(event) => setIncludeStyle(!includeStyle)} />
      <label htmlFor="includeStyle">Include SimpleStyle?</label>
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