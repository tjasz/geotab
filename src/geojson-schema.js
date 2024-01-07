export const geojsonGeometrySchema = {
  $defs: {
    "pointCoordinates": {
      type: "array",
      items: {
        type: "number"
      }
    },
    "multiPointCoordinates": {
      type: "array",
      items: { $ref: "#/$defs/pointCoordinates" }
    },
    "multiLineStringCoordinates": {
      type: "array",
      items: { $ref: "#/$defs/multiPointCoordinates" }
    },
    "multiPolygonCoordinates": {
      type: "array",
      items: { $ref: "#/$defs/multiLineStringCoordinates" }
    },
    "pointGeometry": {
      type: "object",
      properties: {
        type: "Point",
        coordinates: { $ref: "#/$defs/pointCoordinates" }
      }
    },
    "multiPointGeometry": {
      type: "object",
      properties: {
        type: "MultiPoint",
        coordinates: { $ref: "#/$defs/multiPointCoordinates" }
      }
    },
    "lineStringGeometry": {
      type: "object",
      properties: {
        type: "LineString",
        coordinates: { $ref: "#/$defs/multiPointCoordinates" }
      }
    },
    "multiLineStringGeometry": {
      type: "object",
      properties: {
        type: "MultiLineString",
        coordinates: { $ref: "#/$defs/multiLineStringCoordinates" }
      }
    },
    "polygonGeometry": {
      type: "object",
      properties: {
        type: "Polygon",
        coordinates: { $ref: "#/$defs/multiLineStringCoordinates" }
      }
    },
    "multiPolygonGeometry": {
      type: "object",
      properties: {
        type: "MultiPolygon",
        coordinates: { $ref: "#/$defs/multiPolygonCoordinates" }
      }
    },
    "geometry": {
      "anyOf": [
        { $ref: "#/$defs/pointGeometry" },
        { $ref: "#/$defs/multiPointGeometry" },
        { $ref: "#/$defs/lineStringGeometry" },
        { $ref: "#/$defs/multiLineStringGeometry" },
        { $ref: "#/$defs/polygonGeometry" },
        { $ref: "#/$defs/multiPolygonGeometry" },
        { $ref: "#/$defs/geometryCollection" },
      ]
    },
    "geometryCollection": {
      type: "object",
      properties: {
        type: "GeometryCollection",
        geometries: {
          type: "array",
          items: { $ref: "#/$defs/geometry" }
        }
      }
    }
  },
  $ref: "#/$defs/geometry"
}