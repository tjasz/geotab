import React, {useContext} from 'react';
import {DataContext} from './dataContext.js'
import {evaluateFilter} from './filter.js'

function TableView(props) {
  return (
    <div id="tableview" style={props.style}>
      <DataTable />
    </div>
  );
}

function sortBy(features, sorting) {
  const [key, asc] = sorting;
  const fsort = (a, b) => {
    if (a.properties[key] === b.properties[key]) {
      return 0;
    } else if (a.properties[key] < b.properties[key]) {
      return asc ? -1 : 1;
    }
    return asc ? 1 : -1;
  }
  features.sort(fsort);
}


function DataTable() {
  const context = useContext(DataContext);
  if (!context.data) return null;
  const features = context.data.filter((row) => evaluateFilter(row, context.filter));
  if (context.sorting !== null) {
    sortBy(features, context.sorting);
  }
  let columns = context.columns;
  return (
    <table id="data-table" cellSpacing={0}>
      <tbody>
        <tr>
          <th></th>
          {Array.from(columns).map((column) => <th key={column.name} onClick={() => {
            context.setSorting([column.name, (context.sorting && context.sorting[0] === column.name) ? !context.sorting[1] : true]); }}>{column.name}</th>)}
        </tr>
        {features.map((feature, fidx) =>
          <tr key={fidx} onClick={() => context.setActive(feature.hash)} className={context.active !== null && feature.hash === context.active ? "active" : ""}>
            <th>{1+fidx}</th>
            {Array.from(columns).map((column) => <td key={`${fidx}-${column.name}`}>{JSON.stringify(feature["properties"][column.name])}</td>)}
          </tr>)}
      </tbody>
    </table>
  );
}

export default TableView;