import React, {useContext, useEffect, useRef, useState, KeyboardEvent} from 'react';
import { apply, AdditionalOperation, RulesLogic } from 'json-logic-js';
import { v4 as uuidv4 } from 'uuid';
import { Calculate, DataObject, Delete, Straighten } from '@mui/icons-material';
import { sortBy } from './../algorithm'
import {DataContext} from './../dataContext'
import DataTableRow from './DataTableRow'
import DataTableHeader from './DataTableHeader'
import {Sorting} from './sorting'
import {Feature, FeatureProperties, FeatureType, GeometryType, Geometry, GeometryCollection} from '../geojson-types'
import { Button, Table, TableBody, TableContainer, TableHead, TablePagination, Toolbar, Typography } from '@mui/material';
import { simplify } from '../geojson-calc';
import { JsonFieldDialog } from '../JsonFieldDialog';
import { Draft07 } from 'json-schema-library';
import { getSchema } from '../json-logic/schema';
import { geojsonGeometrySchema } from '../geojson-schema'

export default function DataTable() {
  const context = useContext(DataContext);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sorting, setSorting] = useState<Sorting|undefined>(undefined);
  const [disabled, setDisabled] = useState(true);
  const [editGeometryOpen, setEditGeometryOpen] = React.useState<boolean>(false);
  const [calculateJsonDialogOpen, setCalculateJsonDialogOpen] = React.useState<boolean>(false);
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set([]));

  const features:Feature[] = context?.filteredData ?? [];
  const visibleFeatures = features.slice(page * rowsPerPage, (page+1) * rowsPerPage);

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
  const addRows = (amount:number) => {
    const newFeatures : Feature[] = Array(amount).fill({}).map(_ => ({
      id: uuidv4(),
      type: FeatureType.Feature,
      geometry: {
        type: GeometryType.Point,
        coordinates: [0,0]},
      properties: { "geotab:selectionStatus": "inactive" }
    }));
    context.setFromJson({type: FeatureType.FeatureCollection, features: newFeatures});
  };

  // --------------------------

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setSelectedRows(new Set([]));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSelectedRows(new Set([]));
  };

  const handleDeleteRows = () => {
    const newData = context.data.filter(f => !selectedRows.has(f.id));
    context.setData(newData);
  };

  const handleSimplifyGeometry = () => {
    const newData = context.data.map(f => selectedRows.has(f.id) ? simplify(f, 10) : f);
    context.setData(newData);
  }

  const setGeometry = (newGeometry) => {
    const newData = context.data.map(f => selectedRows.has(f.id) ? {...f, geometry: newGeometry} : f);
    context.setData(newData);
  }

  const calculateGeometry = (formula:RulesLogic<AdditionalOperation>) => {
    try {
      if (formula !== undefined) {
        const newData = context.data.map((feature, index) =>
          selectedRows.has(feature.id)
            ? {...feature, geometry: apply(formula, {feature, index, features: context.filteredData}).geometry}
            : feature);
        context.setData(newData);
      }
    }
    catch (error) {
      if (error instanceof SyntaxError) {
        alert(`Error parsing formula "${formula}": ${error.message}`);
      }
      else {
        throw error;
      }
    }
  };

  const handleToggleSelection = (id : string) => {
    const newSet = new Set(selectedRows);
    if (selectedRows.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRows(newSet);
  }

  return (
    <>
      <Toolbar>
        <Button
          startIcon={<Delete />}
          disabled={selectedRows.size < 1}
          onClick={handleDeleteRows}
          >
          Delete
        </Button>
        <Button
          startIcon={<Straighten />}
          disabled={selectedRows.size < 1}
          onClick={handleSimplifyGeometry}
          >
          Simplify Geometry
        </Button>
        <Button
          startIcon={<DataObject />}
          disabled={selectedRows.size !== 1}
          onClick={() => {
            setEditGeometryOpen(true);
          }}
          >
          Edit Geometry
        </Button>
        <Button
          startIcon={<Calculate />}
          disabled={selectedRows.size < 1}
          onClick={() => {
            setCalculateJsonDialogOpen(true);
          }}
          >
          Calculate Geometry
        </Button>
        <Typography>
          {selectedRows.size} Selected
        </Typography>
      </Toolbar>
      <TableContainer style={{ maxHeight: "85%" }}>
        <Table stickyHeader>
          <TableHead>
            <DataTableHeader
              columns={context.columns}
              setColumns={context.setColumns}
              sorting={sorting}
              setSorting={handleSortingChange}
              disabled={disabled}
              setDisabled={setDisabled}
              addRows={addRows}
              />
          </TableHead>
          <TableBody>
            {visibleFeatures.map((feature, fidx) =>
              <DataTableRow
                key={feature.id}
                cellRefs={refs}
                handleKeyDown={handleKeyDown}
                columns={context.columns}
                fidx={fidx + page*rowsPerPage}
                feature={feature}
                rowId={feature.id}
                onChange={handleRowChange}
                disabled={disabled}
                isRowSelected={selectedRows.has(feature.id)}
                onClick={(e, id) => handleToggleSelection(id)}
                />)}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[12, 25, 50, 100, 200, 400]}
        component="div"
        count={features.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        />
      {selectedRows.size === 1 ? <JsonFieldDialog
        title="Edit Geometry"
        confirmLabel="Update"
        defaultValue={context?.data.find(f => selectedRows.has(f.id))?.geometry ?? null}
        schema={new Draft07(geojsonGeometrySchema)}
        open={editGeometryOpen}
        onConfirm={(newGeometry) => { setGeometry(newGeometry); setEditGeometryOpen(false); }}
        onCancel={() => { setEditGeometryOpen(false); }}
      /> : null}
      <JsonFieldDialog
        title="Calculate Geometry"
        confirmLabel="Calculate"
        defaultValue={{var: "feature"}}
        schema={new Draft07(getSchema(context?.columns ?? []))}
        open={calculateJsonDialogOpen}
        onConfirm={(formula) => { calculateGeometry(formula); setCalculateJsonDialogOpen(false); }}
        onCancel={() => { setCalculateJsonDialogOpen(false); }}
        // TODO document additional operations addd to JSON logic
        description={
          <p>
            Input a valid <a href="https://jsonlogic.com">JSON logic</a> to compute the geometry of the selected features.
            In addition to the default <a href="https://jsonlogic.com/operations.html">JSON logic operations</a>,
            the methods of <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math">JavaScript's Math object</a> are
            included under "Math" (ex: "Math.abs")
            and the <a href="https://turfjs.org/docs">Turf.js operations</a> are included under "Turf"
            (ex: "Turf.buffer").
          </p>
        }
      />
    </>
  );
}