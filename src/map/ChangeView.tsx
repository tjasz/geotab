import { LatLng } from "leaflet";
import React from "react";
import { useContext, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { getFeatureListBounds, parseIntOr, parseLatLngOr } from "../algorithm";
import { DataContext } from "../dataContext";
import { LeafletButton } from "./LeafletButton";
import { LocateControl } from "./LocateControl";
import { MapContextPopup } from "./MapContextPopup";
import { MyLayersControl } from "./MyLayerControl";
import { mapLayers } from "./maplayers"

export function ChangeView() {
  const [urlParams, setUrlParams] = useSearchParams();
  const context = useContext(DataContext);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [isContextPopupOpen, setIsContextPopupOpen] = useState(false);
  const [contextClickLocation, setContextClickLocation] = useState<LatLng | null>(null);
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
        prev.set("z", z.toString());
        prev.set("ll", `${ll.lat.toFixed(5)},${ll.lng.toFixed(5)}`);
        return prev;
      });
    },
    baselayerchange: (event) => {
      setUrlParams((prev) => {
        prev.set("b", event.propagatedFrom.options.geotabId);
        return prev;
      });
    },
    overlayadd: (event) => {
      setUrlParams((prev) => {
        const overlays = prev.get("o")?.split(",") ?? [];
        const newOverlay = event.propagatedFrom.options.geotabId;

        if (!overlays.includes(newOverlay)) {
          prev.set("o", [...overlays, newOverlay].join(","));
        }

        return prev;
      });
    },
    overlayremove: (event) => {
      setUrlParams((prev) => {
        const overlays = prev.get("o")?.split(",") ?? [];
        const removedOverlay = event.propagatedFrom.options.geotabId;
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

  const features = context?.filteredData ?? [];
  const featureListBounds = getFeatureListBounds(features)
  const validFeatureListBounds = featureListBounds &&
    featureListBounds[0][0] !== featureListBounds[1][0] &&
    featureListBounds[0][1] !== featureListBounds[1][1];
  const fitToBounds = (map: L.Map) => {
    if (featureListBounds) {
      // if bounds are just a point, center that point at default zoom level
      if (featureListBounds[0][0] === featureListBounds[1][0] &&
        featureListBounds[0][1] === featureListBounds[1][1]) {
        map.setView(featureListBounds[0], parseIntOr(urlParams.get("z"), 6));
      }
      else {
        map.fitBounds(featureListBounds);
      }
    }
  }

  if (!center && !zoom) {
    if (!urlParams.has("ll")) {
      fitToBounds(map);
    }

    map.setView(
      parseLatLngOr(urlParams.get("ll"), [27.83596, -11.07422]),
      parseIntOr(urlParams.get("z"), 2)
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
        onClick={fitToBounds}
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