const baseLayers = [
  {
    type: "TileLayer",
    name: "OpenStreetMap",
    geotabId: "osm",
    checked: true,
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    type: "TileLayer",
    name: "OpenTopoMap",
    geotabId: "otm",
    checked: false,
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    url: "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    type: "TileLayer",
    name: "Mapbox Outdoors",
    geotabId: "mbout",
    checked: false,
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    id: "mapbox/outdoors-v11",
    url: "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGphc3oiLCJhIjoiY2wxcDQ4eG1pMHZxNDNjcGM3djJ4eGphMCJ9.aH-D5oeZHZVzcWQZeeRviQ",
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  },
  {
    type: "TileLayer",
    name: "Mapbox Satellite",
    geotabId: "mbsat",
    checked: false,
    maxZoom: 18,
    tileSize: 512,
    zoomOffset: -1,
    id: "mapbox/satellite-v9",
    url: "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidGphc3oiLCJhIjoiY2wxcDQ4eG1pMHZxNDNjcGM3djJ4eGphMCJ9.aH-D5oeZHZVzcWQZeeRviQ",
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  },
  {
    type: "WMSTileLayer",
    name: "USGS Topo",
    geotabId: "ustopo",
    checked: false,
    layers: "show%3A0",
    f: "image",
    imageSR: 102100,
    bboxSR: 102100,
    format: "png32",
    transparent: true,
    opacity: 1,
    dpi: 96,
    url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/export",
    attribution:
      'Map data &copy; <a href="https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer">USGS</a>',
  },
  {
    type: "WMSTileLayer",
    name: "USGS TNM Blank",
    geotabId: "blank",
    checked: false,
    layers: "show%3A21",
    f: "image",
    imageSR: 102100,
    bboxSR: 102100,
    format: "png32",
    transparent: true,
    opacity: 1,
    dpi: 96,
    url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTNMBlank/MapServer/export",
    attribution:
      'Map data &copy; <a href="https://basemap.nationalmap.gov/arcgis/rest/services/USGSTNMBlank/MapServer">USGS</a>',
  },
];

const overlays = [
  {
    type: "WMSTileLayer",
    name: "NOAA Snow Depth",
    geotabId: "snow",
    checked: false,
    layers: "show:3",
    f: "image",
    imageSR: 102100,
    bboxSR: 102100,
    format: "png8",
    transparent: true,
    opacity: 0.6,
    dpi: 96,
    url: "https://mapservices.weather.noaa.gov/raster/rest/services/snow/NOHRSC_Snow_Analysis/MapServer/export?",
    attribution:
      'Snow data &copy; <a href="https://mapservices.weather.noaa.gov/raster/rest/services/snow/NOHRSC_Snow_Analysis/MapServer/legend">NOAA</a>',
  },
  {
    type: "WMSTileLayer",
    name: "USGS Shaded Relief",
    geotabId: "relief",
    checked: false,
    layers: "show%3A21",
    f: "image",
    imageSR: 102100,
    bboxSR: 102100,
    format: "png32",
    transparent: true,
    opacity: 0.6,
    dpi: 96,
    url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/export",
    attribution:
      'Map data &copy; <a href="https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer">USGS</a>',
  },
  {
    type: "TileLayer",
    name: "Strava Heatmap",
    geotabId: "sheat",
    checked: false,
    maxZoom: 12,
    tileSize: 512,
    zoomOffset: -1,
    url: "https://heatmap-external-a.strava.com/tiles/all/orange/{z}/{x}/{y}.png",
    attribution:
      'Heatmap &copy; <a href="https://www.strava.com">Strava</a>',
  },
];

export const mapLayers = {
  baseLayers,
  overlays,
};

export default mapLayers;
