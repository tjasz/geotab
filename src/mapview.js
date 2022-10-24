import React, {useRef, useContext} from 'react';
import { MapContainer, TileLayer, WMSTileLayer, LayersControl, GeoJSON, Popup } from 'react-leaflet';
import {DataContext} from './dataContext.js'
import {getCentralCoord, hashCode} from './algorithm.js'

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
      return (
        <div id="mapview" style={props.style}>
          <MapContainer center={[47.5, -122.3]} zoom={10} scrollWheelZoom={true} ref={mapRef} whenReady={() => resizeMap(mapRef)}>
            <GeoJSON data={context.data} key={hashCode(JSON.stringify(context.data))} style={(feature) => { return {
              color: context.active !== null && context.active === feature.hash ? "#e0e000" : "#336799",
              weight: 2 + (context.active !== null && context.active === feature.hash ? 3: 0)
            }}} />
            {context.active !== null && <ActivePopup feature={context.data.find((feature) => feature.hash === context.active)} />}
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="OpenStreetMap">
                <TileLayer
                    maxZoom={18}
                    tileSize={512}
                    zoomOffset={-1}
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="OpenTopoMap">
                <TileLayer
                    maxZoom={18}
                    tileSize={512}
                    zoomOffset={-1}
                    url="https://a.tile.opentopomap.org/{z}/{x}/{y}.png"
                    attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery &copy; <a href="https://www.opentopomap.org/">opentopomap.org</a>'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Mapbox Outdoors">
                <TileLayer
                    maxZoom={18}
                    tileSize={512}
                    zoomOffset={-1}
                    id='mapbox/outdoors-v11'
                    url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGphc3oiLCJhIjoiY2wxcDQ4eG1pMHZxNDNjcGM3djJ4eGphMCJ9.aH-D5oeZHZVzcWQZeeRviQ"
                    attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Mapbox Satellite">
                <TileLayer
                    maxZoom={18}
                    tileSize={512}
                    zoomOffset={-1}
                    id='mapbox/satellite-v9'
                    url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGphc3oiLCJhIjoiY2wxcDQ4eG1pMHZxNDNjcGM3djJ4eGphMCJ9.aH-D5oeZHZVzcWQZeeRviQ"
                    attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
                />
              </LayersControl.BaseLayer>
              <LayersControl.Overlay name="NOAA Snow Depth">
                <WMSTileLayer
                    layers={'show%3A3'}
                    f={'image'}
                    imageSR={102100}
                    bboxSR={102100}
                    format={'png8'}
                    transparent={true}
                    opacity={0.6}
                    dpi={96}
                    url="https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Observations/NOHRSC_Snow_Analysis/MapServer/export?"
                    attribution='Snow data &copy; <a href="https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Observations/NOHRSC_Snow_Analysis/MapServer/legend">NOAA</a>'
                />
              </LayersControl.Overlay>
            </LayersControl>
          </MapContainer>
        </div>
      );
    }

function ActivePopup(props) {
  return (
    props.feature === null ? null :
      <Popup position={getCentralCoord(props.feature).slice().reverse()}>{props.feature.properties.title}</Popup>
  );
};

export default MapView;