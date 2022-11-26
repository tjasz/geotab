const baseLayers = [
  {
    type: "TileLayer",
    name: "OpenStreetMap",
    checked: true,
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    id: null,
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    type: "TileLayer",
    name: "OpenTopoMap",
    checked: false,
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    id: null,
    url: "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    type: "TileLayer",
    name: "Mapbox Outdoors",
    checked: false,
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    id: 'mapbox/outdoors-v11',
    url: "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGphc3oiLCJhIjoiY2wxcDQ4eG1pMHZxNDNjcGM3djJ4eGphMCJ9.aH-D5oeZHZVzcWQZeeRviQ",
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  },
  {
    type: "TileLayer",
    name: "Mapbox Satellite",
    checked: false,
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    id: 'mapbox/satellite-v9',
    url: "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGphc3oiLCJhIjoiY2wxcDQ4eG1pMHZxNDNjcGM3djJ4eGphMCJ9.aH-D5oeZHZVzcWQZeeRviQ",
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  },
];

const overlays = [
  {
    type: "WMSTileLayer",
    name: "NOAA Snow Depth",
    checked: false,
    layers: 'show%3A3',
    f: 'image',
    imageSR: 102100,
    bboxSR: 102100,
    format: 'png8',
    transparent: true,
    opacity: 0.6,
    dpi: 96,
    url: "https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Observations/NOHRSC_Snow_Analysis/MapServer/export?",
    attribution: 'Snow data &copy; <a href="https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Observations/NOHRSC_Snow_Analysis/MapServer/legend">NOAA</a>',
  },
];

export const mapLayers = {
  baseLayers,
  overlays
};

export default mapLayers;