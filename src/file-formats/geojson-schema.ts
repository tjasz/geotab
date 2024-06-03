// Schema based on the GeoJSON spec - RFC 7946
// https://datatracker.ietf.org/doc/html/rfc7946

function ref(name: string) {
  return { $ref: `#/$defs/${name}` };
}

const type = {
  number: "number",
  array: "array",
  object: "object",
};

// Section 3.1 Geometry Object
const geometryType = {
  point: "Point",
  multiPoint: "MultiPoint",
  lineString: "LineString",
  multiLineString: "MultiLineString",
  polygon: "Polygon",
  multiPolygon: "MultiPolygon",
  geometryCollection: "GeometryCollection",
}

// Section 3.1.1 Position
const position = {
  type: type.array,
  items: {
    type: type.number,
    minItems: 2,
    maxItems: 3,
  },
};

// Section 3.1.2 Point
const pointGeometry = {
  type: type.object,
  properties: {
    type: geometryType.point,
    coordinates: ref("position"),
  },
};

// Section 3.1.3 MultiPoint
const multiPointGeometry = {
  type: type.object,
  properties: {
    type: geometryType.multiPoint,
    coordinates: {
      type: type.array,
      items: ref("position"),
    },
  },
};

// Section 3.1.4 LineString
const lineStringCoordinates = {
  type: type.array,
  items: ref("position"),
  minItems: 2,
};
const lineStringGeometry = {
  type: type.object,
  properties: {
    type: geometryType.lineString,
    coordinates: ref("lineStringCoordinates"),
  },
};

// Section 3.1.5 MultiLineString
const multiLineStringGeometry = {
  type: type.object,
  properties: {
    type: geometryType.multiLineString,
    coordinates: {
      type: type.array,
      items: ref("lineStringCoordinates"),
    }
  },
};

// Section 3.1.6 Polygon
const polygonCoordinates = {
  type: type.array,
  items: {
    type: type.array,
    items: ref("position"),
    minItems: 4,
  }
};
const polygonGeometry = {
  type: type.object,
  properties: {
    type: geometryType.polygon,
    coordinates: ref("polygonCoordinates"),
  },
};

// Section 3.1.7 MultiPolygon
const multiPolygonGeometry = {
  type: type.object,
  properties: {
    type: geometryType.multiPolygon,
    coordinates: {
      type: type.array,
      items: ref("polygonCoordinates"),
    },
  },
};

// Section 3.1.8 GeometryCollection
const geometry = {
  anyOf: [
    ref("pointGeometry"),
    ref("multiPointGeometry"),
    ref("lineStringGeometry"),
    ref("multiLineStringGeometry"),
    ref("polygonGeometry"),
    ref("multiPolygonGeometry"),
    ref("geometryCollection"),
  ],
};
const geometryCollection = {
  type: type.object,
  properties: {
    type: geometryType.geometryCollection,
    geometries: {
      type: type.array,
      items: ref("geometry"),
    },
  },
};

// Section 3.2 Feature
const feature = {
  type: type.object,
  properties: {
    type: "Feature",
    geometry: ref("geometry"),
    properties: {
      type: type.object
    }
  }
}

// Section 3.3 FeatureCollection
const featureCollection = {
  type: type.object,
  properties: {
    type: "FeatureCollection",
    features: {
      type: type.array,
      items: ref("feature"),
    }
  }
};

export const geojsonGeometrySchema = {
  $defs: {
    position,
    lineStringCoordinates,
    polygonCoordinates,
    pointGeometry,
    multiPointGeometry,
    lineStringGeometry,
    multiLineStringGeometry,
    polygonGeometry,
    multiPolygonGeometry,
    geometry,
    geometryCollection,
  },
  $ref: "#/$defs/geometry",
};

export const geojsonSchema = {
  $defs: {
    position,
    lineStringCoordinates,
    polygonCoordinates,
    pointGeometry,
    multiPointGeometry,
    lineStringGeometry,
    multiLineStringGeometry,
    polygonGeometry,
    multiPolygonGeometry,
    geometry,
    geometryCollection,
    feature,
    featureCollection,
  },
  anyOf: [
    ref("geometry"),
    ref("feature"),
    ref("featureCollection"),
  ],
};