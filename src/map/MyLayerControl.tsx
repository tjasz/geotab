import { ControlPosition } from "leaflet";
import { LayersControl, TileLayer, WMSTileLayer } from "react-leaflet";
import { LayerConfig } from "./maplayers";

type MyLayersControlProps = {
  position: ControlPosition | undefined;
  mapLayers: {
    baseLayers: LayerConfig[],
    overlays: LayerConfig[],
  }
}

export function MyLayersControl({ position, mapLayers }: MyLayersControlProps) {
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

function MyOverlayControl(props: LayerConfig) {
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

function MyBaseLayerControl(props: LayerConfig) {
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