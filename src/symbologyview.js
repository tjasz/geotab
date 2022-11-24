import React, {useContext} from 'react';
import {DataContext} from './dataContext.js'
import {PolygonMarker} from './iconlib.js'

const hasCaltopoSymbology = (columns) => {
  const caltopoParams = ["marker-color", "marker-size", "marker-symbol", "marker-rotation",
  "stroke", "stroke-width", "stroke-opacity", "pattern" ||
  "fill", "fill-opacity"];
  return caltopoParams.some((param) => columns.some((column) => column.name === param));
};

function SymbologyView(props) {
  const context = useContext(DataContext);
  const caltopoSymbology = (feature, latlng) => {
    if (feature.geometry?.type == "Point") {
      // TODO caltopo marker-size, marker-symbol, marker-rotation
      return PolygonMarker(latlng, Infinity, 5*(feature.properties["marker-size"] ?? 1), feature.properties["marker-color"] ?? "#336799");
    } else {
      const color = feature.properties["marker-color"] ?? feature.properties["stroke"] ?? "#336799";
      const weight = feature.properties["stroke-width"] ?? 2;
      const opacity = feature.properties["stroke-opacity"] ?? 1;
      let dashArray = "";
      if (feature.properties["pattern"]) {
        switch(feature.properties["pattern"]) {
          case "solid":
            dashArray = "";
            break;
          case "M0 -1 L0 1,,8,F": // dot
            dashArray = `${weight} ${2*weight}`;
            break;
          case "M0 -3 L0 3,,12,F": // dash
            dashArray = `${4*weight} ${2*weight}`;
            break;
          case "M0 -3 L0 3,0,16,F;M0 -1L0 0,8,16": // dashdot
            dashArray = `${4*weight} ${2*weight} ${weight} ${2*weight}`;
            break;
        }
      }
      const lineCap="butt";
      const fillColor = feature.properties["fill"] ?? "#b3e7ff";
      const fillOpacity = feature.properties["fill-opacity"] ?? 1;
      return {color, weight, opacity, dashArray, lineCap, fillColor, fillOpacity};
    }
  };
  const setCaltopo = () => {
    context.setSymbology(caltopoSymbology);
  };
  return (
    <div id="symbologyview" style={props.style}>
      {hasCaltopoSymbology(context.columns) &&
        <button onClick={setCaltopo}>Use Symbology from Caltopo</button>}
    </div>
  );
}

export default SymbologyView;