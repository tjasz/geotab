import React, {useContext, useEffect, useRef, useState, KeyboardEvent} from 'react';
import { sortBy } from './../algorithm'
import {DataContext} from './../dataContext'
import DataTableRow from './DataTableRow'
import DataTableHeader from './DataTableHeader'
import {Sorting} from './sorting'
import {Feature, FeatureProperties} from '../geojson-types'

export default function DataTable() {
  const context = useContext(DataContext);
  const [sorting, setSorting] = useState<Sorting|undefined>(undefined);
  const [disabled, setDisabled] = useState(true);

  const features:Feature[] = context?.filteredData ?? [];
  const refs = useRef<{[colName:string]: HTMLInputElement|null}[]>([]);
  // useEffect to update the ref on data update
  useEffect(() => {
    refs.current = [];
  }, [context?.columns]);

  if (!context?.filteredData) return null;

  const handleKeyDown = (e:KeyboardEvent, row:number, col:string) => {
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
                  const fieldToUpdate = refs.current[fidx][colName];
                  if (fieldToUpdate !== null) {
                    fieldToUpdate.value = v;
                  }
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
            const replacement = newFeatures.find((newf:Feature) => newf.id === feature.id);
            return replacement ?? feature;
          })
          context.setData(updatedData);
        })
      }
    }
    // use arrows/enter to navigate cells
    let focusTarget:HTMLInputElement|null = null;
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
  const handleSortingChange = (newSorting:Sorting|undefined) => {
    if (!newSorting) return;
    if (sorting && newSorting &&
      sorting.asc === newSorting.asc &&
      sorting.col.name === newSorting.col.name) {
      return;
    }
    setSorting(newSorting);
    context.setData(sortBy(context.data, newSorting).slice());
  };
  const handleRowChange = (newRow:FeatureProperties, idx:number) => {
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
            disabled={disabled}
            />)}
      </tbody>
    </table>
  );
}