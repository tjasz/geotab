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

function sortBy(features, sorting) {
  const fsort = (a, b) => {
    if (a.properties[sorting] === b.properties[sorting]) {
      return 0;
    } else if (a.properties[sorting] < b.properties[sorting]) {
      return -1;
    }
    return 1;
  }
  features.sort(fsort);
}


function DataTable() {
  const context = useContext(DataContext);
  const features = context.data;
  if (context.sorting !== null) {
    sortBy(features, context.sorting);
  }
  let properties = context.columns;
  return (
    <table id="data-table" cellSpacing={0}>
      <tbody>
        <tr>
          <th></th>
          {Array.from(properties).map((key) => <th key={key} onClick={() => { context.setSorting(key); }}>{key}</th>)}
        </tr>
        {features.map((feature, fidx) =>
          <tr key={fidx} onClick={() => context.setActive(feature.hash)} className={context.active !== null && feature.hash === context.active ? "active" : ""}>
            <th>{1+fidx}</th>
            {Array.from(properties).map((key) => <td key={`${fidx}-${key}`}>{JSON.stringify(feature["properties"][key])}</td>)}
          </tr>)}
      </tbody>
    </table>
  );
}

export default TableView;