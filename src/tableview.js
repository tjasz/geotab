import React, {useContext} from 'react';
import {DataContext} from './dataContext.js'

function TableView(props) {
  return (
    <div id="tableview" style={props.style}>
      <DataTable />
    </div>
  );
}

function getFeatures(data) {
  if (data["type"] === "Feature") {
    return data;
  }
  else if (data["type"] === "FeatureCollection") {
    return data["features"].map((feature) => getFeatures(feature)).flat();
  }
  return [];
}

function getPropertiesUnion(features) {
  const keys = features.map((feature) => Object.keys(feature["properties"])).flat();
  return new Set(keys);
}

function DataTable() {
  const context = useContext(DataContext);
  const data = context.data;
  let features = getFeatures(data);
  let properties = getPropertiesUnion(features);
  return (
    <table id="data-table" cellSpacing={0}>
      <tbody>
        <tr>
          <th></th>
          {Array.from(properties).map((key) => <th key={key}>{key}</th>)}
        </tr>
        {features.map((feature, fidx) => <tr key={fidx}>
            <th>{fidx}</th>
            {Array.from(properties).map((key) => <td key={`${fidx}-${key}`}>{JSON.stringify(feature["properties"][key])}</td>)}
          </tr>)}
      </tbody>
    </table>
  );
}

export default TableView;