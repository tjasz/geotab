import { LayersControl, TileLayer, TileLayerProps, WMSTileLayer, WMSTileLayerProps } from "react-leaflet";

type MyLayerControlProps = {
  name: string;
  checked: boolean;
} & (({
  type: "WMSTileLayer";
} & WMSTileLayerProps) | ({
  type: "TileLayer"
} & TileLayerProps));

export function MyOverlayControl(props: MyLayerControlProps) {
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

export function MyBaseLayerControl(props: MyLayerControlProps) {
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