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
      const styleAsCss = {
        stroke: style.stroke ? style.color : "none",
        "stroke-width": style.weight,
        "stroke-opacity": style.opacity,
        "stroke-linecap": style.lineCap,
        "stroke-linejoin": style.lineJoin,
        "stroke-dasharray": style.dashArray,
        "stroke-dashoffset": style.dashOffset,
        fill: style.fill ? style.fillColor : "none",
        "fill-opacity": style.fillOpacity,
        "fill-rule": style.fillRule,
      }
      const simpleStyleMarker = {
        "marker-symbol": style.symbol,
        "marker-color": style.color,
        "marker-size": style.size,
        "marker-rotation": style.rotation ? style.rotation : undefined,
      }
      switch (formatSelection) {
        case "geojson+css":
          // TODO pass styling for markers
          return {
            ...f,
            style: styleAsCss,
          };
        case "geojson+simplestyle":
          // Technically SimpleStyle requires colors of the format #ace or #aaccee
          // but MapBox's own geojson.io accepts any valid CSS color definition.
          // Do no color conversion here.

          // TODO try to convert symbol names to Maki icon names

          // convert marker-size number into marker-size "small" | "medium" | "large"
          let markerSizeName = "medium";
          if (style.size <= 0.75) {
            markerSizeName = "small";
          }
          if (style.size >= 1.5) {
            markerSizeName = "large";
          }

          return {
            ...f, properties: {
              ...f.properties,
              ...styleAsCss,
              ...simpleStyleMarker,
              "marker-size": markerSizeName,
            }
          }
        case "geojson+caltopo":
          // CalTopo does not believe in opacity. It only parses 3 or 6 digit hex values with a # prefix.
          // Anything else gets replaced with black.
          // If the provided value was 4 or 7 digits, slice off the last ones.
          let color = simpleStyleMarker["marker-color"];
          if (color) {
            if (color.length > 7) {
              color = color.slice(0, 7);
            }
            if (color.length === 5) {
              color = color.slice(0, 4);
            }
          }

          // TODO try to convert symbol names to CalTopo compatible names

          return {
            ...f, properties: {
              ...f.properties,
              ...styleAsCss,
              pattern: style.pattern,
              ...simpleStyleMarker,
              "marker-color": color,
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