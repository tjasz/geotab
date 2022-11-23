import React, {useContext} from 'react';
import {DataContext} from './dataContext.js'

function SymbologyView(props) {
  const context = useContext(DataContext);
  const caltopoSymbology = (feature) => {
    let color = "#336799";
    let weight = 2;
    let opacity = 1;
    let dashArray = "";
    let fillColor = "#b3e7ff";
    let fillOpacity = 1;
    if ("marker-color" in feature.properties) {
      color = feature.properties["marker-color"];
    }
    if ("stroke" in feature.properties) {
      color = feature.properties.stroke;
    }
    return {color, weight, opacity, dashArray, fillColor, fillOpacity};
  };
  const setCaltopo = () => {
    context.setSymbology(caltopoSymbology);
  };
  return (
    <div id="symbologyview" style={props.style}>
      <button onClick={setCaltopo}>Import from Caltopo</button>
    </div>
  );
}

export default SymbologyView;