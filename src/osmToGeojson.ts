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
  console.log(osmElem);

  const nodes = getChildrenOfElem(osmElem, "node");
  const nodeFeatures : Map<string, Feature> = new Map(nodes.map(node => {
    const id = node.getAttribute("id")!;
    return [id, {
      id,
      type: FeatureType.Feature,
      geometry: {
        type: GeometryType.Point,
        coordinates: [
          Number(node.getAttribute("lon")),
          Number(node.getAttribute("lat")),
        ]
      },
      properties: getTagsAsObj(node),
    }]
  }));

  const ways = getChildrenOfElem(osmElem, "way");
  const wayFeatures = ways.map(way => {
    return {
      id: way.getAttribute("id"),
      type: FeatureType.Feature,
      geometry: {
        type: GeometryType.LineString,
        coordinates: getChildrenOfElem(way, "nd").map(nd => {
          const ref = nd.getAttribute("ref")!;
          return nodeFeatures.get(ref)?.geometry.coordinates;
        }),
      },
      properties: getTagsAsObj(way),
    }
  });

  const geojson = {
    type: FeatureType.FeatureCollection,
    features: [
      ...Array.from(nodeFeatures.values()).filter(node => Object.keys(node.properties).length > 0),
      ...wayFeatures
    ],
    properties: {},
  };

  return geojson;
}

function getAttributesAsObj(elem : Element) {
  const obj = {};
  if (elem.hasAttributes()) {
    for (let i = 0; i < elem.attributes.length; ++i) {
      const attr = elem.attributes.item(i)!;
      obj[attr.name] = attr.value;
    }
  }
  return obj;
}

function getTagsAsObj(elem : Element) {
  const tags = getChildrenOfElem(elem, "tag");
  return tags.reduce(
    (obj, tag) => {
      if (tag.hasAttributes() && tag.hasAttribute("k") && tag.hasAttribute("v")) {
        return {...obj, [tag.getAttribute("k")!]: tag.getAttribute("v")}
      }
      return obj;
    },
    {}
  )
}

function getChildrenOfElem(parent : Element, tagName : string) {
  return Array.from(parent.children).filter((elem) =>
    elem.tagName === tagName
  );
}