import React, { useRef, useContext, useState } from "react";
import ReactDOMServer from "react-dom/server";
import L from "leaflet";
import {
  MapContainer,
  ScaleControl,
  GeoJSON,
  Popup,
} from "react-leaflet";
import { DataContext } from "./dataContext";
import { getCentralCoord, hashCode } from "./algorithm";
import { painter } from "./painter";
import { addHover, removeHover, toggleActive } from "./selection";
import { FeaturePopup } from "./map/FeaturePopup"
import { ChangeView } from "./map/ChangeView"

function MapView(props) {
  const context = useContext(DataContext);
  const resizeMap = (mapRef) => {
    const resizeObserver = new ResizeObserver(() =>
      mapRef.current?.invalidateSize(),
    );
    const container = document.getElementById("mapview");
    if (container) {
      resizeObserver.observe(container);
    }
  };
  const restyleLayer = (layer, feature) => {
    const style = painter(context.symbology)(feature);
    if (layer.setStyle instanceof Function) {
      layer.setStyle(style);
    } else {
      layer.setIcon(
        L.divIcon({ className: "", html: style.options.icon.options.html }),
      );
    }
  };
  const mapRef = useRef();
  if (!context.filteredData) return null;
  const features = context.filteredData;
  return (
    <div id="mapview" style={props.style}>
      <MapContainer
        scrollWheelZoom={true}
        ref={mapRef}
        whenReady={() => resizeMap(mapRef)}
      >
        <ChangeView />
        <ScaleControl position="bottomleft" />
        <GeoJSON
          data={features}
          key={hashCode(JSON.stringify(features))}
          style={painter(context.symbology)}
          pointToLayer={painter(context.symbology)}
          onEachFeature={(feature, layer) => {
            context.setFeatureListener(
              "map",
              feature.id,
              restyleLayer.bind(null, layer),
            );
            layer.once({
              mouseover: (e) => {
                feature.properties["geotab:selectionStatus"] = addHover(
                  feature.properties["geotab:selectionStatus"],
                );
                restyleLayer(e.target, feature);
                const tableListener =
                  context?.featureListeners.table[feature.id] ??
                  context?.featureListeners.table["default"];
                if (tableListener !== undefined) {
                  tableListener(feature);
                }
              },
            });
            layer.on({
              click: (e) => {
                feature.properties["geotab:selectionStatus"] = toggleActive(
                  feature.properties["geotab:selectionStatus"],
                );
                restyleLayer(e.target, feature);
                const tableListener =
                  context?.featureListeners.table[feature.id] ??
                  context?.featureListeners.table["default"];
                if (tableListener !== undefined) {
                  tableListener(feature);
                }
              },
              mouseout: (e) => {
                feature.properties["geotab:selectionStatus"] = removeHover(
                  feature.properties["geotab:selectionStatus"],
                );
                restyleLayer(e.target, feature);
                e.target.once({
                  mouseover: (e) => {
                    feature.properties["geotab:selectionStatus"] = addHover(
                      feature.properties["geotab:selectionStatus"],
                    );
                    restyleLayer(e.target, feature);
                    const tableListener =
                      context?.featureListeners.table[feature.id] ??
                      context?.featureListeners.table["default"];
                    if (tableListener !== undefined) {
                      tableListener(feature);
                    }
                  },
                });
                const tableListener =
                  context?.featureListeners.table[feature.id] ??
                  context?.featureListeners.table["default"];
                if (tableListener !== undefined) {
                  tableListener(feature);
                }
              },
            });
            layer.bindPopup(
              ReactDOMServer.renderToString(<FeaturePopup feature={feature} />),
            );
          }}
        />
      </MapContainer>
    </div>
  );
}

function ActivePopup(props) {
  return (
    props.feature &&
    props.feature.geometry && (
      <Popup position={props.latlng ?? getCentralCoord(props.feature)}>
        <FeaturePopup feature={props.feature} />
      </Popup>
    )
  );
}

export default MapView;
