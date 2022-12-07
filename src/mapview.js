import React, {useRef, useContext} from 'react';
import { MapContainer, TileLayer, WMSTileLayer, LayersControl, ScaleControl, GeoJSON, Popup, useMap } from 'react-leaflet';
import { AbridgedUrlLink } from './common-components.js';
import {DataContext} from './dataContext.js'
import {getCentralCoord, hashCode, getFeatureListBounds} from './algorithm.js'
import {evaluateFilter} from './filter.js'
import mapLayers from './maplayers.js'
import {painter} from './painter.js'

function MapView(props) {
    const context = useContext(DataContext);
      const resizeMap = ( mapRef ) => {
        const resizeObserver = new ResizeObserver(() => mapRef.current?.invalidateSize())
        const container = document.getElementById('mapview')
        if (container) {
          resizeObserver.observe(container)
        }
      };
      const mapRef = useRef();
      if (!context.data) return null;
      const features = context.data.filter((row) => evaluateFilter(row, context.filter));
      return (
        <div id="mapview" style={props.style}>
          <MapContainer scrollWheelZoom={true} ref={mapRef} whenReady={() => resizeMap(mapRef)}>
            <ChangeView />
            <ScaleControl position="bottomleft" />
            <GeoJSON data={features} key={hashCode(JSON.stringify(features))} style={painter(context.symbology)}
            pointToLayer={painter(context.symbology)}
            onEachFeature={(feature, layer) => {
              layer.on({
                click: () => { context.setActive(feature.id) }
              })
            }} />
            {context.active !== null && <ActivePopup feature={features.find((feature) => feature.id === context.active)} />}
            <MyLayersControl position="topright" mapLayers={mapLayers} />
          </MapContainer>
        </div>
      );
    }

function ActivePopup(props) {
  return (
    props.feature && props.feature.geometry &&
      <Popup position={getCentralCoord(props.feature)}>
        <table><tbody>
          {Object.entries(props.feature.properties).map(([key, value]) =>
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
      </Popup>
  );
};

function ChangeView({ center, zoom }) {
  const context = useContext(DataContext);
  const features = context.data.filter((row) => evaluateFilter(row, context.filter));
  const map = useMap();
  if (context.active !== null) {
    const feature = features.find((feature) => feature.id === context.active);
    if (feature !== null && feature !== undefined && feature.geometry !== null && feature.geometry !== undefined) {
      map.setView(getCentralCoord(feature) || [47.5,-122.3], map.getZoom() || 6);
    }
  } else if (features) {
    const featureListBounds = getFeatureListBounds(features);
    featureListBounds && map.fitBounds(featureListBounds);
  }
  return null;
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