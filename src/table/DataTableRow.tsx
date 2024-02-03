import {KeyboardEvent, RefObject, useContext, useState} from 'react'
import Checkbox from '@mui/material/Checkbox';
import DataTableCell from './DataTableCell'
import {Column} from './../column'
import {Feature, FeatureProperties} from './../geojson-types'
import {toggleActive, addHover, removeHover} from '../selection'
import {DataContext} from '../dataContext'
import { TableCell, TableRow } from '@mui/material';

type TableRowProps = {
  fidx: number,
  rowId: string,
  columns: Column[],
  disabled: boolean,
  cellRefs: RefObject<{[colName:string]: HTMLInputElement|null}[]>,
  feature: Feature,
  isRowSelected: boolean,
  onClick: (event: React.MouseEvent<HTMLTableRowElement, MouseEvent> | undefined, f: Feature) => void,
  onChange: (properties:FeatureProperties, fidx:number) => void,
  handleKeyDown: (e:KeyboardEvent, row:number, col:string) => void,
}

export default function DataTableRow(props:TableRowProps) {
  const context = useContext(DataContext);
  const [className, setClassName] = useState(props.feature.properties["geotab:selectionStatus"] ?? "inactive");
  if (context !== null) {
    context.setFeatureListener(
      "table",
      props.feature.id,
      (f) => { setClassName(f.properties["geotab:selectionStatus"]); props.onClick(undefined, f); }
    );
  }
  const handleCellChange = (value:any, column:Column) => {
    const newFeatureProperties = {...props.feature.properties, [column.name]: value};
    props.onChange(newFeatureProperties, props.fidx);
  };
  return (
    <TableRow
      onContextMenu={() => console.log(props.feature)}
      onClick={(e) => {
        props.feature.properties["geotab:selectionStatus"] = toggleActive(props.feature.properties["geotab:selectionStatus"]);
        props.onClick(e, props.feature);
        setClassName(props.feature.properties["geotab:selectionStatus"]);
        const mapListener = context?.featureListeners.map[props.feature.id] ?? context?.featureListeners.map["default"];
        if (mapListener !== undefined) {
          mapListener(props.feature);
        }
      }}
      onMouseOver={(e) => {
        props.feature.properties["geotab:selectionStatus"] = addHover(props.feature.properties["geotab:selectionStatus"]);
        setClassName(props.feature.properties["geotab:selectionStatus"]);
        const mapListener = context?.featureListeners.map[props.feature.id] ?? context?.featureListeners.map["default"];
        if (mapListener !== undefined) {
          mapListener(props.feature);
        }
      }}
      onMouseOut={(e) => {
        props.feature.properties["geotab:selectionStatus"] = removeHover(props.feature.properties["geotab:selectionStatus"]);
        setClassName(props.feature.properties["geotab:selectionStatus"]);
        const mapListener = context?.featureListeners.map[props.feature.id] ?? context?.featureListeners.map["default"];
        if (mapListener !== undefined) {
          mapListener(props.feature);
        }
      }}
      className={className}
      style={
        className === "active"
        ? { backgroundColor: "#ffff00" }
        : className === "hoveractive"
        ? { backgroundColor: "#ffff9f" }
        : className === "hoverinactive"
        ? { backgroundColor: "#ffffcf" }
        : {}
      }
      >
      <TableCell component="th">
        <Checkbox
          checked={props.isRowSelected}
          />
      </TableCell>
      <TableCell component="th">
        {props.fidx}
      </TableCell>
      {Array.from(props.columns).filter((column) => column.visible).map((column) =>
        <DataTableCell
          key={`${props.rowId}:${column.name}`}
          cellRefs={props.cellRefs}
          handleKeyDown={props.handleKeyDown}
          column={column}
          fidx={props.fidx}
          value={props.feature.properties[column.name]}
          onChange={handleCellChange}
          disabled={props.disabled}
          />)}
    </TableRow>
  );
}