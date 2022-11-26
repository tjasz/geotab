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
  const [col, asc] = sorting;
  const fsort = (a, b) => {
    let av = a.properties[col.name];
    let bv = b.properties[col.name];
    if (col.type === "number") {
      av = Number(av);
      bv = Number(bv);
    }
    if (col.type === "date") {
      av = new Date(Date.parse(av));
      bv = new Date(Date.parse(bv));
    }
    if (av === bv) {
      return 0;
    } else if (av < bv) {
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
  return (
    <table id="data-table" cellSpacing={0}>
      <tbody>
        <TableHeader columns={context.columns} sorting={context.sorting} setSorting={context.setSorting} />
        {features.map((feature, fidx) =>
          <TableRow
            key={fidx}
            columns={context.columns}
            fidx={fidx}
            feature={feature}
            active={context.active !== null && feature.hash === context.active}
            setActive={context.setActive} />)}
      </tbody>
    </table>
  );
}

function TableHeader(props) {
  return (
    <tr>
      <th></th>
      {Array.from(props.columns).map((column) =>
        <th
          key={column.name}
          onClick={() => {
            props.setSorting([column, (props.sorting && props.sorting[0].name === column.name) ? !props.sorting[1] : true]);
          }}>
          {column.name}
        </th>)}
    </tr>
  );
}

function TableRow(props) {
  return (
    <tr onClick={() => props.setActive(props.feature.hash)} className={props.active ? "active" : ""}>
      <th>{1+props.fidx}</th>
      {Array.from(props.columns).map((column) =>
        <TableCell key={`${column.name}`} column={column} value={props.feature.properties[column.name]} />)}
    </tr>
  );
}

function TableCell(props) {
  return (
    <td>{
      props.value !== undefined &&
      (props.value.startsWith("http")
        ? <AbridgedUrlLink target="_blank" href={props.value} length={21} />
        : props.column.type === "number"
          ? Number(props.value)
          : props.column.type === "date"
            ? new Date(Date.parse(props.value)).toISOString()
            : JSON.stringify(props.value)
      )
    }</td>
  );
}

function AbridgedUrlLink(props) {
  const firstHalfLength = Math.floor((props.length - 3)/2);
  const secondHalfLength = props.length % 2 ? firstHalfLength : firstHalfLength+1;
  const withoutProtocol = props.href.split('//')[1];
  const abridged = `${withoutProtocol.slice(0,firstHalfLength)}...${withoutProtocol.slice(-secondHalfLength)}`
  return (
    <a target={props.target} href={props.href}>
      {abridged}
    </a>
  );
}

export default TableView;