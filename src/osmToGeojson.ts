import { Feature, FeatureCollection, FeatureType, GeometryType } from "./geojson-types";

export function osmToGeojson(xmlString : string) : FeatureCollection {
  const domParser = new window.DOMParser();
  const xml = domParser.parseFromString(xmlString, 'text/xml');

  if (xml.children.length === 0) {
    throw Error("Invalid OSM: No XML elements found.");
  }
  if (xml.children.length > 1) {
    throw Error("Invalid OSM: Multiple root elements found.")
  }

  const osmElem = xml.children.item(0)!;
  if (osmElem.tagName !== "osm") {
    throw Error(`Invalid OSM: outer node should be an <osm> element. Found '${osmElem.tagName}'.`);
  }

  const nodes = getChildrenOfTag(osmElem, "node");
  const features : Feature[] = nodes.map(node => {
    const nodeProperties = {};
    if (node.hasAttributes()) {
      for (let i = 0; i < node.attributes.length; ++i) {
        const attr = node.attributes.item(i)!;
        nodeProperties[attr.name] = attr.value;
      }
    }

    return {
      type: FeatureType.Feature,
      geometry: {
        type: GeometryType.Point,
        coordinates: [
          Number(node.getAttribute("lon")),
          Number(node.getAttribute("lat")),
        ]
      },
      properties: nodeProperties,
    }
  });

  const geojson = {
    type: FeatureType.FeatureCollection,
    features,
    properties: {},
  };

  return geojson;
}

function getChildrenOfTag(parent : Element, tagName : string) {
  return Array.from(parent.children).filter((elem) =>
    elem.tagName === tagName
  );
}