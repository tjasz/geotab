import React, {useContext, useEffect, useRef, useState} from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuIcon from '@mui/icons-material/Menu';
import { sortBy } from './../algorithm'
import {DataContext} from './../dataContext'
import DataTableRow from './DataTableRow'
import DataTableHeader from './DataTableHeader'

function TableView(props) {
  return (
    <div id="tableview" style={props.style}>
      <DataTable />
    </div>
  );
}

function DataTable() {
  const context = useContext(DataContext);
  const [sorting, setSorting] = useState(null);
  const [disabled, setDisabled] = useState(true);

  const features = context.filteredData;
  const refs = useRef({});
  // useEffect to update the ref on data update
  useEffect(() => {
    refs.current = {};
  }, [context.columns]);

  if (!context.filteredData) return null;

  const handleKeyDown = (e, row, col) => {
    // lock table using Ctrl+S
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setDisabled(true);
    }
    // paste using Ctrl+V
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const target = refs.current?.[row]?.[col];
      if (target) {
        navigator.clipboard.readText().then((result) => {
          const pasteTable = result.replaceAll('\r', '').split('\n').map((r) => r.split('\t'));
          const baseColIdx = context.columns.findIndex((c) => c.name === col);
          const newFeatures = context.filteredData
            .map((feature, fidx) => {
            if (fidx >= row && fidx < row + pasteTable.length) {
              const pasteRow = fidx - row;
              const newProperties = pasteTable[pasteRow].reduce((acc, v, i) => {
                if (baseColIdx + i < context.columns.length) {
                  const colName = context.columns[baseColIdx+i].name;
                  refs.current[fidx][colName].value = v;
                  return {...acc, [colName]: v};
                }
                return acc;
              }, feature.properties);
              return {...feature, properties: newProperties};
            } else {
              return feature;
            }
          });
          const updatedData = context.data.map((feature) => {
            const replacement = newFeatures.find((newf) => newf.id === feature.id);
            return replacement ?? feature;
          })
          context.setData(updatedData);
        })
      }
    }
    // use arrows/enter to navigate cells
    let focusTarget = null;
    if (refs.current?.[row]?.[col]) {
      if (e.key === 'Down' || e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
        focusTarget = refs.current[Math.min(row+1, features.length-1)][col];
      } else if (e.key === 'Up' || e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
        focusTarget = refs.current[Math.max(row-1, 0)][col];
      }
      if (focusTarget) {
        e.preventDefault();
        focusTarget.focus();
        focusTarget.select();
      }
    }
  }
  const handleSortingChange = (newSorting) => {
    if (context.sorting && newSorting &&
      context.sorting[0] === newSorting[0] &&
      context.sorting[1] === newSorting[1]) {
      return;
    }
    setSorting(newSorting);
    context.setData(sortBy(context.data, newSorting).slice());
  };
  const handleRowChange = (newRow, idx) => {
    const newFeatures = context.data.map((f) => f.id === features[idx].id ? {...f, properties: newRow} : f);
    context.setData(newFeatures);
  };

  return (
    <table id="data-table" cellSpacing={0}>
      <thead>
        <DataTableHeader
          columns={context.columns}
          setColumns={context.setColumns}
          sorting={sorting}
          setSorting={handleSortingChange}
          disabled={disabled}
          setDisabled={setDisabled} />
      </thead>
      <tbody>
        {features.map((feature, fidx) =>
          <DataTableRow
            key={feature.id}
            cellRefs={refs}
            handleKeyDown={handleKeyDown}
            columns={context.columns}
            fidx={fidx}
            feature={feature}
            rowId={feature.id}
            onChange={handleRowChange}
            active={context.active !== null && feature.id === context.active}
            setActive={context.setActive}
            disabled={disabled}
            />)}
      </tbody>
    </table>
  );
}

export default TableView;