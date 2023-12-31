import React from 'react';
import * as GeoJson from './geojson-types'
import {Column} from './column'
import {ConditionGroup} from './filter'
import {Symbology} from './painter'

export type GeotabMetadata = {
  columns: Column[], // TODO define column definition type
  filter: any, // TODO define filter type
  symbology: any, // TODO define symbology definition type
}

export type Updater<T> = (old:T) => T;
export type UpdaterOrValue<T> = Updater<T>|T;

export function getValueFromUpdaterOrValue<T>(updaterOrValue:UpdaterOrValue<T>, currentValue:T|undefined) : T|undefined {
  if (typeof updaterOrValue === "function") {
    if (currentValue === undefined) {
      return undefined;
    }
    return (updaterOrValue as Updater<T>)(currentValue);
  } else {
    return updaterOrValue;
  }
}

export type FeatureListener = (feature:GeoJson.Feature) => void;
export type FeatureListenerTable = {
  [id:string]: {table: FeatureListener|undefined, map: FeatureListener|undefined}
}

export type DataContextType = {
  data: GeoJson.Feature[],
  filter: any, // TODO define filter type
  filteredData: GeoJson.Feature[],
  columns: Column[],
  symbology: Symbology | null,
  featureListeners: FeatureListenerTable,
  setData: {(updaterOrValue:UpdaterOrValue<GeoJson.Feature[]>) : void},
  setFilter: {(newFilter:UpdaterOrValue<ConditionGroup|undefined>) : void},
  setDataAndFilter: {(newData:UpdaterOrValue<GeoJson.Feature[]>, newFilter:UpdaterOrValue<ConditionGroup|undefined>) : void},
  setColumns: {(newColumns:UpdaterOrValue<Column[]>) : void},
  setSymbology: {(newSymbology:UpdaterOrValue<Symbology|null>) : void},
  setFeatureListener: {(id:string, view:"table"|"map", f:FeatureListener)}
  setFromJson: {(json:GeoJson.FeatureCollection & {geotabMetadata?:GeotabMetadata}) : void},
} | null;

export const DataContext = React.createContext<DataContextType>(null);