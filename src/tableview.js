import React, {useContext} from 'react';
import {DataContext} from './dataContext.js'
import {hashCode, getFeatures, getPropertiesUnion} from './algorithm'

function TableView(props) {
  return (
    <div id="tableview" style={props.style}>
      <DataTable />
    </div>
  );
}

function DataTable() {
  const context = useContext(DataContext);
  const features = context.data;
  let properties = getPropertiesUnion(features);
  return (
    <table id="data-table" cellSpacing={0}>
      <tbody>
        <tr>
          <th></th>
          {Array.from(properties).map((key) => <th key={key}>{key}</th>)}
        </tr>
        {features.map((feature, fidx) =>
          <tr key={fidx} onClick={() => context.setActive(feature.hash)} className={context.active !== null && feature.hash === context.active ? "active" : ""}>
            <th>{fidx}</th>
            {Array.from(properties).map((key) => <td key={`${fidx}-${key}`}>{JSON.stringify(feature["properties"][key])}</td>)}
          </tr>)}
      </tbody>
    </table>
  );
}

export default TableView;