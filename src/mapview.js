import React, {useRef, useContext, useState} from 'react';
import ReactDOMServer from "react-dom/server";
import L from 'leaflet'
import { MapContainer, TileLayer, WMSTileLayer, LayersControl, ScaleControl, GeoJSON, Popup, useMap, useMapEvents } from 'react-leaflet';
import { AbridgedUrlLink } from './common-components';
import {DataContext} from './dataContext'
import {getCentralCoord, hashCode, getFeatureListBounds} from './algorithm'
import mapLayers from './maplayers'
import {painter} from './painter'
import {addHover, removeHover, toggleActive} from './selection'

function MapView(props) {
    const context = useContext(DataContext);
      const resizeMap = ( mapRef ) => {
        const resizeObserver = new ResizeObserver(() => mapRef.current?.invalidateSize())
        const container = document.getElementById('mapview')
        if (container) {
          resizeObserver.observe(container)
        }
      };
      const restyleLayer = (layer, feature) => {
        const style = painter(context.symbology)(feature);
        if (layer.setStyle instanceof Function) {
          layer.setStyle(style);
        } else {
          layer.setIcon(L.divIcon({className: "", html: style.options.icon.options.html}))
        }
      }
      const mapRef = useRef();
      if (!context.filteredData) return null;
      const features = context.filteredData;
      return (
        <div id="mapview" style={props.style}>
          <MapContainer scrollWheelZoom={true} ref={mapRef} whenReady={() => resizeMap(mapRef)}>
            <ChangeView />
            <ScaleControl position="bottomleft" />
            <GeoJSON data={features} key={hashCode(JSON.stringify(features))} style={painter(context.symbology)}
            pointToLayer={painter(context.symbology)}
            onEachFeature={(feature, layer) => {
              context.setFeatureListener(feature.id, "map", restyleLayer.bind(null, layer))
              layer.once({
                mouseover: (e) => {
                  feature.properties["geotab:selectionStatus"] = addHover(feature.properties["geotab:selectionStatus"]);
                  restyleLayer(e.target, feature);
                  const tableListener = context?.featureListeners[feature.id]?.["table"];
                  if (tableListener !== undefined) {
                    tableListener(feature);
                  }
                },
              })
              layer.on({
                click: (e) => {
                  feature.properties["geotab:selectionStatus"] = toggleActive(feature.properties["geotab:selectionStatus"]);
                  restyleLayer(e.target, feature);
                  const tableListener = context?.featureListeners[feature.id]?.["table"];
                  if (tableListener !== undefined) {
                    tableListener(feature);
                  }
                },
                mouseout: (e) => {
                  feature.properties["geotab:selectionStatus"] = removeHover(feature.properties["geotab:selectionStatus"]);
                  restyleLayer(e.target, feature);
                  e.target.once({
                    mouseover: (e) => {
                      feature.properties["geotab:selectionStatus"] = addHover(feature.properties["geotab:selectionStatus"]);
                      restyleLayer(e.target, feature);
                      const tableListener = context?.featureListeners[feature.id]?.["table"];
                      if (tableListener !== undefined) {
                        tableListener(feature);
                      }
                    },
                  });
                  const tableListener = context?.featureListeners[feature.id]?.["table"];
                  if (tableListener !== undefined) {
                    tableListener(feature);
                  }
                },
              })
              layer.bindPopup(
                ReactDOMServer.renderToString(
                    <PopupBody feature={feature} />
                )
              )
            }} />
            <MyLayersControl position="topright" mapLayers={mapLayers} />
          </MapContainer>
        </div>
      );
    }

function ActivePopup(props) {
  return (
    props.feature && props.feature.geometry &&
      <Popup position={props.latlng ?? getCentralCoord(props.feature)}>
        <PopupBody feature={props.feature} />
      </Popup>
  );
};

function PopupBody({feature}) {
  return (
    <table><tbody>
      {Object.entries(feature.properties).map(([key, value]) =>
        <tr key={key}>
          <th>{key}</th>
          <td>
            {(value === "" ? undefined :
              typeof value === "string" && value.startsWith("http")
              ? <AbridgedUrlLink target="_blank" href={value} length={21} />
              : typeof value === "string" || typeof value === "number"
                    ? value
                    : JSON.stringify(value)
            )}
          </td>
        </tr>
      )}
    </tbody></table>
  );
}

function ChangeView() {
  const context = useContext(DataContext);
  const [center, setCenter] = useState(null);
  const [zoom, setZoom] = useState(null);
  const map = useMap();
  const mapEvents = useMapEvents({
      zoomend: () => {
          setZoom(mapEvents.getZoom());
      },
      moveend: () => {
          setCenter(mapEvents.getCenter());
      },
  });
  if (!center && !zoom) {
    const features = context.filteredData;
    if (features && features.length) {
      const featureListBounds = getFeatureListBounds(features);
      featureListBounds && map.fitBounds(featureListBounds);
    } else {
      map.setView([47.5,-122.3], 6);
    }
  }
}

function MyLayersControl({position, mapLayers}) {
  return (
    <LayersControl position={position}>
      {mapLayers.baseLayers.map((baseLayer) =>
        <MyBaseLayerControl key={baseLayer.name} {...baseLayer} />
        )}
      {mapLayers.overlays.map((overlay) =>
        <MyOverlayControl key={overlay.name} {...overlay} />
        )}
    </LayersControl>
  );
}

function MyBaseLayerControl(props) {
  switch(props.type) {
    case "WMSTileLayer":
      return (
        <LayersControl.BaseLayer name={props.name} checked={props.checked}>
          <WMSTileLayer {...props} />
        </LayersControl.BaseLayer>
      );
    case "TileLayer":
      return (
        <LayersControl.BaseLayer name={props.name} checked={props.checked}>
          <TileLayer {...props} />
        </LayersControl.BaseLayer>
      );
    // TODO more overlay types
    default:
      return null;
  }
}

function MyOverlayControl(props) {
  switch(props.type) {
    case "WMSTileLayer":
      return (
        <LayersControl.Overlay name={props.name} checked={props.checked}>
          <WMSTileLayer {...props} />
        </LayersControl.Overlay>
      );
    case "TileLayer":
      return (
        <LayersControl.Overlay name={props.name} checked={props.checked}>
          <TileLayer {...props} />
        </LayersControl.Overlay>
      );
    // TODO more overlay types
    default:
      return null;
  }
}

export default MapView;