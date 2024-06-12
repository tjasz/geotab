import React, { useRef, useContext, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactDOMServer from "react-dom/server";
import L from "leaflet";
import {
  MapContainer,
  ScaleControl,
  GeoJSON,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { DataContext } from "./dataContext";
import { getCentralCoord, hashCode, getFeatureListBounds } from "./algorithm";
import mapLayers from "./map/maplayers";
import { painter } from "./painter";
import { addHover, removeHover, toggleActive } from "./selection";
import { LeafletButton } from "./map/LeafletButton"
import { MapContextPopup } from "./map/MapContextPopup"
import { LocateControl } from "./map/LocateControl"
import { FeaturePopup } from "./map/FeaturePopup"
import { MyLayersControl } from "./map/MyLayerControl"

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

function ChangeView() {
  const [urlParams, setUrlParams] = useSearchParams();
  const context = useContext(DataContext);
  const [center, setCenter] = useState(null);
  const [zoom, setZoom] = useState(null);
  const [isContextPopupOpen, setIsContextPopupOpen] = useState(false);
  const [contextClickLocation, setContextClickLocation] = useState();
  const map = useMap();
  const mapEvents = useMapEvents({
    contextmenu: (event) => {
      setIsContextPopupOpen(true);
      setContextClickLocation(event.latlng);
    },
    moveend: () => {
      const ll = mapEvents.getCenter();
      const z = mapEvents.getZoom();
      setCenter(ll);
      setZoom(z);
      setUrlParams((prev) => {
        prev.set("z", z);
        prev.set("ll", `${ll.lat.toFixed(5)},${ll.lng.toFixed(5)}`);
        return prev;
      });
    },
    baselayerchange: (event) => {
      setUrlParams((prev) => {
        prev.set("b", event.layer.options.geotabId);
        return prev;
      });
    },
    overlayadd: (event) => {
      setUrlParams((prev) => {
        const overlays = prev.get("o")?.split(",") ?? [];
        const newOverlay = event.layer.options.geotabId;

        if (!overlays.includes(newOverlay)) {
          prev.set("o", [...overlays, newOverlay].join(","));
        }

        return prev;
      });
    },
    overlayremove: (event) => {
      setUrlParams((prev) => {
        const overlays = prev.get("o")?.split(",") ?? [];
        const removedOverlay = event.layer.options.geotabId;
        const newOverlays = overlays.filter((id) => id !== removedOverlay);

        if (newOverlays.length === 0) {
          prev.delete("o");
        } else {
          prev.set("o", newOverlays.join(","));
        }

        return prev;
      });
    },
  });

  const features = context.filteredData;
  const featureListBounds = getFeatureListBounds(features)
  const validFeatureListBounds = featureListBounds &&
    featureListBounds[0][0] !== featureListBounds[1][0] &&
    featureListBounds[0][1] !== featureListBounds[1][1];

  if (!center && !zoom) {
    if (!urlParams.has("ll")) {
      if (features && features.length) {
        if (validFeatureListBounds) {
          map.fitBounds(featureListBounds);
          return;
        } else {
          map.setView(featureListBounds[0], urlParams.get("z") ?? 6);
        }
      }
    }

    map.setView(
      urlParams
        .get("ll")
        ?.split(",")
        .map((s) => parseFloat(s)) ?? [27.83596, -11.07422],
      urlParams.get("z") ?? 2,
    );
  }

  return (
    <>
      <MyLayersControl
        position="topright"
        mapLayers={{
          baseLayers: mapLayers.baseLayers.map((layer, index) => ({
            ...layer,
            checked: (urlParams.get("b") ?? "osm") === layer.geotabId,
          })),
          overlays: mapLayers.overlays.map((layer, index) => ({
            ...layer,
            checked: urlParams.get("o")?.split(",").includes(layer.geotabId),
          })),
        }}
      />
      <LocateControl />
      {validFeatureListBounds && <LeafletButton
        position="topleft"
        className="leaflet-control-fitbounds"
        title="Fit Map to Feature Bounds"
        iconClass="leaflet-control-fitbounds-icon"
        onClick={(map, event) => map.fitBounds(featureListBounds)}
      />}
      {isContextPopupOpen && (
        <MapContextPopup
          latlng={contextClickLocation}
          zoom={zoom}
          onClose={() => {
            setIsContextPopupOpen(false);
          }}
        />
      )}
    </>
  );
}

export default MapView;
