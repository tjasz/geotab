export type Coordinate = number[];
export type PointCoordinates = Coordinate;
export type MultiPointCoordinates = PointCoordinates[];
export type LineStringCoordinates = Coordinate[];
export type MultiLineStringCoordinates = LineStringCoordinates[];
export type PolygonCoordinates = Coordinate[][];
export type MultiPolygonCoordinates = PolygonCoordinates[];

// allow additional string keys to map to any type
type Extension = {[index: string]: any}

export type Point = Extension & {
  type: string;
  coordinates: PointCoordinates;
}

export type MultiPoint = Extension & {
  type: string;
  coordinates: MultiPointCoordinates;
}

export type LineString = Extension & {
  type: string;
  coordinates: LineStringCoordinates;
}

export type MultiLineString = Extension & {
  type: string;
  coordinates: MultiLineStringCoordinates;
}

export type Polygon = Extension & {
  type: string;
  coordinates: PolygonCoordinates;
}

export type MultiPolygon = Extension & {
  type: string;
  coordinates: MultiPolygonCoordinates;
}

export type Geometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;

export type GeometryCollection = Extension & {
  geometries: Geometry[];
}

export type Feature = Extension & {
  type: string;
  geometry: Geometry | GeometryCollection;
  properties: Extension;
}

export type FeatureCollection = Extension & {
  type: string;
  features: Feature[];
}