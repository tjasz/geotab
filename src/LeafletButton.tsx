import L, { ControlOptions } from "leaflet";
import { createControlComponent } from '@react-leaflet/core';

type MapEventHandler = (map: L.Map, e: Event) => void;

type ButtonOptions = ControlOptions & {
  className: string;
  title: string;
  iconClass: string;
  onClick?: MapEventHandler;
  onDblClick?: MapEventHandler;
  onContextMenu?: MapEventHandler;
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

    // add event handlers
    if (this.options.onClick !== undefined) {
      L.DomEvent.addListener(div, 'click', (e) => {
        L.DomEvent.stop(e);
        this.options.onClick!(map, e);
      });
    }
    if (this.options.onDblClick !== undefined) {
      L.DomEvent.addListener(div, 'dblclick', (e) => {
        L.DomEvent.stop(e);
        this.options.onDblClick!(map, e);
      });
    }
    if (this.options.onContextMenu !== undefined) {
      L.DomEvent.addListener(div, 'contextmenu', (e) => {
        L.DomEvent.stop(e);
        this.options.onContextMenu!(map, e);
      });
    }

    return div;
  }

  onRemove(map: L.Map) {
  }
}

export const LeafletButton = createControlComponent<ButtonControl, ButtonOptions>(
  props => new ButtonControl(props)
);