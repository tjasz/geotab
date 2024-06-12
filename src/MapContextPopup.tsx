import { AddLocation, ContentCopy } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useContext } from "react";
import { Popup } from "react-leaflet";
import { DataContext } from "./dataContext";
import { FeatureType, GeometryType } from "./geojson-types";

export function MapContextPopup({ latlng, zoom, onClose }) {
  const context = useContext(DataContext);

  const latlng5 = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
  const lat3 = latlng.lat.toFixed(3);
  const lng3 = latlng.lng.toFixed(3);

  function uuidv4() {
    throw new Error("Function not implemented.");
  }

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
            context?.setData([...context.data, newFeature]);
            onClose();
          }}
        >
          Add Point
        </Button>
      </div>
    </Popup>
  );
}