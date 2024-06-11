import L, { ControlOptions } from "leaflet";
import { createControlComponent } from '@react-leaflet/core'

type ButtonOptions = ControlOptions & {
  className: string;
  title: string;
  iconClass: string;
};

export class ButtonControl extends L.Control {
  options: ButtonOptions;

  constructor(options: ButtonOptions) {
    super(options);
    this.options = options;
  }

  onAdd(map: L.Map) {
    const div = L.DomUtil.create("div", `${this.options.className} leaflet-control leaflet-bar`);

    const link = L.DomUtil.create("a", "leaflet-bar-part leaflet-bar-part-single", div);
    link.href = "#";
    link.title = this.options.title;
    link.role = "button";

    const span = L.DomUtil.create("span", this.options.iconClass, link);

    return div;
  }

  onRemove(map: L.Map) {
  }
}

export const LeafletButton = createControlComponent<ButtonControl, ButtonOptions>(
  props => new ButtonControl(props)
);