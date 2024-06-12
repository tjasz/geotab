import L from "leaflet";
import "leaflet.locatecontrol";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import { createControlComponent } from '@react-leaflet/core';

export const LocateControl = createControlComponent(
  props => new L.Control.Locate(props)
)