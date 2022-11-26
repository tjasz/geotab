import {PolygonMarker} from './iconlib.js'

// TODO handle different types
function painterValue(definition, feature) {
  if (definition.mode === "discrete") {
    if (definition.values.length !== definition.breaks.length + 1) {
      throw Error(`Symbology.values should have 1 more value than Symbology.breaks. Values: ${definition.values}, Breaks: ${definition.breaks}.`)
    }
    if (definition.breaks.length === 0) return definition.values[0];
    // set i to the index where the feature value is first greater than the break value
    let i = 0;
    for (; i < definition.breaks.length; i++) { // TODO binary search?
      if (feature.properties[definition.fieldname] > definition.breaks[i]) {
        break;
      }
    }
    //console.log(`${feature.properties[definition.fieldname]} : ${definition.breaks} : ${i}`)
    return definition.values[i];
  } else if (definition.mode === "continuous") {
    throw Error(`Symbology.mode continuous not implemented.`)
  }
  throw Error(`Symbology.mode: Found ${definition.mode}. Expected 'discrete' or 'continuous'.`)
}

export function painter(symbology) {
  // {
  //   "hue": {mode: "discrete", values: [209], fieldname: null, breaks: []},
  //   "saturation": {mode: "discrete", values: [50], fieldname: null, breaks: []},
  //   "lightness": {mode: "discrete", values: [40], fieldname: null, breaks: []},
  //   "alpha": {mode: "discrete", values: [1], fieldname: null, breaks: []},
  // },
  const fn = (feature, latlng) => {
    const hue = painterValue(symbology.hue, feature);
    const sat = painterValue(symbology.saturation, feature);
    const light = painterValue(symbology.lightness, feature);
    const alpha = painterValue(symbology.alpha, feature);
    const color = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
    //console.log(color)



    if (feature.geometry?.type == "Point") {
      return PolygonMarker(latlng, Infinity, 5*(feature.properties["marker-size"] ?? 1), color);
    } else {
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
  return fn;
}