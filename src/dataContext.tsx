import React from 'react';
import * as GeoJson from './geojson-types'
import {Column} from './column'

export type GeotabMetadata = {
  columns: Column[], // TODO define column definition type
  filter: any, // TODO define filter type
  symbology: any, // TODO define symbology definition type
}
export type DataContextType = {
  data: GeoJson.Feature[],
  filter: any, // TODO define filter type
  filteredData: GeoJson.Feature[],
  columns: Column[],
  active: string | null,
  symbology: any, // TODO define symbology definition type
  setData: {(newData:GeoJson.Feature[]) : void},
  setFilter: {(newFilter:any) : void},
  setDataAndFilter: {(newData:GeoJson.Feature[], newFilter:any) : void},
  setColumns: {(newColumns:any[]) : void},
  setActive: {(newActive?:string) : void},
  setSymbology: {(newSymbology:any) : void},
  setFromJson: {(json:GeoJson.Feature[] & {geotabMetadata:GeotabMetadata}) : void},
} | null;

export const DataContext = React.createContext<DataContextType>(null);