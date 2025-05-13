import React, { useRef, useContext, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ReactDOMServer from "react-dom/server";
import { v4 as uuidv4 } from "uuid";
import L from "leaflet";
import "leaflet.locatecontrol";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet-editable"; // Import Leaflet.Editable
import { createControlComponent } from '@react-leaflet/core'
import { Button } from "@mui/material";
import { AddLocation, ContentCopy, Done, Edit, Polyline, Timeline } from "@mui/icons-material";
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  LayersControl,
  ScaleControl,
  GeoJSON,
  Popup,
  useMap,
  useMapEvents,
  Marker,
} from "react-leaflet";
import Control from 'react-leaflet-custom-control'
import { DataContext } from "./dataContext";
import { getCentralCoord, hashCode, getFeatureListBounds, getFeatureBounds } from "./algorithm";
import mapLayers from "./maplayers";
import { painter, markerStyleToMarker } from "./symbology/painter";
import { addHover, removeHover, toggleActive } from "./selection";
import { FeatureType, GeometryType } from "./geojson-types";
import { LeafletButton } from "./LeafletButton"
import { SvgPatternRenderer } from "./PatternRenderer/SvgPatternRenderer"
import DataCellValue from "./table/DataCellValue"
import FormatPaintControl from "./symbology/FormatPaintControl"

function EditControl({ position = "topleft" }) {
  const context = useContext(DataContext);
  const map = useMap();
  const [drawing, setDrawing] = useState(false);

  const getGeometry = (layer) => {
    // Extract geometry based on layer type
    if (layer instanceof L.Marker) {
      return {
        type: GeometryType.Point,
        coordinates: [layer.getLatLng().lng, layer.getLatLng().lat]
      };
    } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
      const coords = layer.getLatLngs();
      if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
        // MultiLineString
        return {
          type: GeometryType.MultiLineString,
          coordinates: coords.map(lineCoords =>
            lineCoords.map(latlng => [latlng.lng, latlng.lat])
          )
        };
      } else {
        // LineString
        return {
          type: GeometryType.LineString,
          coordinates: coords.map(latlng => [latlng.lng, latlng.lat])
        };
      }
    } else if (layer instanceof L.Polygon) {
      const coords = layer.getLatLngs();
      if (Array.isArray(coords)) {
        if (Array.isArray(coords[0])) {
          if (Array.isArray(coords[0][0])) {
            return {
              type: GeometryType.MultiPolygon,
              coordinates: coords.map(polyCoords =>
                polyCoords.map(ringCoords =>
                  ringCoords.map(latlng => [latlng.lng, latlng.lat])
                )
              )
            };
          } else {
            return {
              type: GeometryType.Polygon,
              coordinates: coords.map(ringCoords =>
                ringCoords.map(latlng => [latlng.lng, latlng.lat])
              )
            };
          }
        } else {
          return {
            type: GeometryType.Polygon,
            coordinates: [coords.map(latlng => [latlng.lng, latlng.lat])]
          };
        }
      }
    }
    return null;
  }

  // Create a new feature and add it to the DataContext
  const createFeature = (layer) => {
    // Generate a new feature with UUID
    const newFeature = {
      id: uuidv4(),
      type: FeatureType.Feature,
      properties: {
        "geotab:selectionStatus": "inactive",
        name: "New Feature"
      },
      geometry: getGeometry(layer)
    };

    // Add the new feature to the DataContext
    context.setData([...context.data, newFeature]);

    // Return the feature id for reference
    return newFeature.id;
  };

  // Update an existing feature in the DataContext
  const updateFeature = (featureId, layer) => {
    context.setData(prevData => {
      return prevData.map(feature => {
        if (feature.id === featureId) {
          const updatedFeature = { ...feature };

          // Update geometry based on layer type
          updatedFeature.geometry = getGeometry(layer);

          return updatedFeature;
        }
        return feature;
      });
    });
  };

  const handleCommit = () => {
    setDrawing(false);
    map.editTools.commitDrawing();
    map.editTools.featuresLayer.clearLayers();
    // disable editing on all layers in the map
    const layers = map._layers;
    for (let id in layers) {
      const layer = layers[id];
      // disable editing on the sub-layers in layer._layers
      if (layer._layers) {
        for (let subId in layer._layers) {
          const subLayer = layer._layers[subId];
          if (subLayer.disableEdit) {
            subLayer.disableEdit();
          }
        }
      }
    }
  }

  // Setup event listeners when component mounts
  useEffect(() => {
    if (!map || !map.editTools) return;

    map.on('editable:enable', e => {
      setDrawing(true);
    })
    map.on('editable:drawing:start', e => {
      setDrawing(true);
    })
    map.on('editable:disable', e => {
      if (e.layer._featureId) {
        updateFeature(e.layer._featureId, e.layer);
      } else {
        createFeature(e.layer);
      }
    })
    map.on('keydown', e => {
      if (e.originalEvent.key === 'Escape' || e.originalEvent.key === 'Enter') {
        handleCommit();
      }
    }
    );

    return () => {
      // Cleanup event listeners
      map.off('editable:enable');
      map.off('editable:drawing:start');
      map.off('editable:disable');
      map.off('keydown');
    };
  }, [map, context]);

  // Create toolbar buttons
  return (
    <Control prepend position={position}>
      <div className="leaflet-bar leaflet-bar-horizontal">
        {drawing && (<a
          onClick={() => {
            handleCommit();
          }}
          className="leaflet-control-edit-commit"
          title="Commit"
        >
          <Done fontSize="small" />
        </a>)}

        {!drawing && (<>
          <a
            onClick={() => map.editTools.startMarker()}
            className="leaflet-control-draw-marker"
            title="Draw a marker"
          >
            <AddLocation fontSize="small" />
          </a>

          <a
            onClick={() => map.editTools.startPolyline()}
            className="leaflet-control-draw-polyline"
            title="Draw a polyline"
          >
            <Timeline fontSize="small" />
          </a>

          <a
            onClick={() => map.editTools.startPolygon()}
            className="leaflet-control-draw-polygon"
            title="Draw a polygon"
          >
            <Polyline fontSize="small" />
          </a>
        </>)}
      </div>
    </Control>
  );
}

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
      const marker = markerStyleToMarker([0, 0], style);
      layer.setIcon(
        L.divIcon({ className: "", html: marker.options.icon.options.html }),
      );
    }
  };

  const mapRef = useRef();

  const [clickedFeature, setClickedFeature] = useState(null);
  const [clickedLatLng, setClickedLatLng] = useState(null);

  if (!context.filteredData) return null;
  const features = context.filteredData;
  return (
    <div id="mapview" style={props.style}>
      <MapContainer
        scrollWheelZoom={true}
        ref={mapRef}
        whenReady={() => resizeMap(mapRef)}
        renderer={new SvgPatternRenderer()}
        editable={true} // Make the map editable
      >
        <ChangeView />
        <ScaleControl position="bottomleft" />
        {context.detailFeature?.cursor &&
          <Marker position={{
            lng: context.detailFeature?.cursor[0],
            lat: context.detailFeature?.cursor[1],
          }} />}
        <GeoJSON
          data={features}
          key={hashCode(JSON.stringify(features))}
          style={painter(context.symbology)}
          pointToLayer={(feature, latlng) => {
            const painterInstance = painter(context.symbology);
            const style = painterInstance(feature);
            return markerStyleToMarker(latlng, style);
          }}
          onEachFeature={(feature, layer) => {
            context.setFeatureListener(
              "map",
              feature.id,
              restyleLayer.bind(null, layer),
            );
            // Store the feature ID on the layer for editing operations
            layer._featureId = feature.id;
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
                setClickedFeature(feature);
                setClickedLatLng(e.latlng);
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
          }}
        />
        {clickedFeature && clickedLatLng && (
          <ActivePopup
            feature={clickedFeature}
            latlng={clickedLatLng}
            columns={context.columns}
            onClose={() => {
              setClickedFeature(null);
              setClickedLatLng(null);
            }}
          />)}
        <EditControl />
      </MapContainer>
    </div>
  );
}

function ActivePopup(props) {
  return (
    props.feature &&
    props.feature.geometry && (
      <Popup position={props.latlng ?? getCentralCoord(props.feature)}>
        <PopupBody feature={props.feature} columns={props.columns} />
      </Popup>
    )
  );
}

function PopupBody({ feature, columns }) {
  const map = useMap();
  const context = useContext(DataContext);
  const isLineFeature = feature?.geometry?.type === GeometryType.LineString ||
    feature?.geometry?.type === GeometryType.MultiLineString;

  // Check if the line feature has elevation data
  const hasElevationData = () => {
    if (!isLineFeature) return false;

    let coordinates = [];
    if (feature.geometry.type === GeometryType.LineString) {
      coordinates = feature.geometry.coordinates;
    } else if (feature.geometry.type === GeometryType.MultiLineString) {
      coordinates = feature.geometry.coordinates.flat();
    }

    return coordinates.length > 0 && coordinates.some(c => c.length >= 3);
  };

  return (
    <div style={{ height: "200px", overflow: "auto", width: "250px" }}>
      <ul>
        {/*edit button*/}
        <li>
          <a
            onClick={() => {
              const layers = map._layers;
              for (let id in layers) {
                const layer = layers[id];
                if (layer._featureId === feature.id) {
                  layer.enableEdit();
                  break;
                }
              }
            }}
          >
            Edit
          </a>
        </li>
        <li>
          <a
            onClick={() => {
              map.fitBounds(getFeatureBounds(feature));
            }
            }
          >
            Zoom to Fit
          </a>
        </li>
        {isLineFeature && hasElevationData() && (<li>
          <a
            onClick={() => {
              context.setDetailFeature({ feature });
            }}
          >
            Elevation Profile
          </a>
        </li>)}
      </ul>
      <table>
        <tbody>
          {
            columns.filter(col => col.visible).map(col =>
              <tr key={col.name}>
                <th>{col.name}</th>
                <td>
                  <DataCellValue value={feature.properties[col.name]} column={col} />
                </td>
              </tr>
            )
          }
        </tbody>
      </table>
    </div>
  );
}

function ContextPopup({ latlng, zoom, onClose }) {
  const map = useMap();
  const context = useContext(DataContext);

  const latlng5 = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
  const lat3 = latlng.lat.toFixed(3);
  const lng3 = latlng.lng.toFixed(3);

  return (
    <Popup position={latlng}>
      <div style={{ height: "200px", overflow: "auto" }}>
        <h2>
          {latlng5}
          <Button
            startIcon={<ContentCopy />}
            onClick={() => {
              navigator.clipboard.writeText(latlng5);
            }}
          />
        </h2>
        <h3>Forecasts</h3>
        <ul>
          <li>
            <a
              href={`https://forecast.weather.gov/MapClick.php?lat=${latlng.lat}&lon=${latlng.lon}&site=all&smap=1`}
              target="_blank"
            >
              NOAA
            </a>
          </li>
          <li>
            <a
              href={`https://www.windy.com/${lat3}/${lng3}?${lat3},${lng3},${zoom}`}
              target="_blank"
            >
              Windy
            </a>
          </li>
          <li>
            <a
              href={`https://www.google.com/maps/dir//${latlng.lat},${latlng.lng}`}
              target="_blank"
            >
              Google Directions
            </a>
          </li>
          <li>
            <a
              href={`https://brouter.de/brouter-web/#map=${zoom}/${latlng.lat}/${latlng.lng}/standard&lonlats=${latlng.lng},${latlng.lat}&profile=shortest`}
              target="_blank"
            >
              BRouter
            </a>
          </li>
        </ul>
        <Button
          startIcon={<AddLocation />}
          onClick={() => {
            const newFeature = {
              id: uuidv4(),
              type: FeatureType.Feature,
              geometry: {
                type: GeometryType.Point,
                coordinates: [latlng.lng, latlng.lat],
              },
              properties: { "geotab:selectionStatus": "inactive" },
            };
            context.setData([...context.data, newFeature]);
            onClose();
          }}
        >
          Add Point
        </Button>
        <Button
          startIcon={<Polyline />}
          onClick={() => {
            map.editTools.startPolyline(latlng);
            onClose();
          }}
        >
          Start Line
        </Button>
      </div>
    </Popup>
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
      <FormatPaintControl />
      {validFeatureListBounds && <LeafletButton
        position="topleft"
        className="leaflet-control-fitbounds"
        title="Fit Map to Feature Bounds"
        iconClass="leaflet-control-fitbounds-icon"
        onClick={(map, event) => map.fitBounds(featureListBounds)}
      />}
      {isContextPopupOpen && (
        <ContextPopup
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

function MyLayersControl({ position, mapLayers }) {
  return (
    <LayersControl position={position}>
      {mapLayers.baseLayers.map((baseLayer) => (
        <MyBaseLayerControl key={baseLayer.name} {...baseLayer} />
      ))}
      {mapLayers.overlays.map((overlay) => (
        <MyOverlayControl key={overlay.name} {...overlay} />
      ))}
    </LayersControl>
  );
}

function MyBaseLayerControl(props) {
  switch (props.type) {
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
  switch (props.type) {
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

const LocateControl = createControlComponent(
  props => new L.Control.Locate(props)
)

export default MapView;
