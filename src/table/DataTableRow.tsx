import {KeyboardEvent, RefObject, useContext, useState} from 'react'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DataTableCell from './DataTableCell'
import RowContextMenu from './RowContextMenu';
import {Column} from './../column'
import {Feature, FeatureProperties} from './../geojson-types'
import {toggleActive, addHover, removeHover} from '../selection'
import {DataContext} from '../dataContext'

type TableRowProps = {
  fidx: number,
  rowId: string,
  columns: Column[],
  disabled: boolean,
  cellRefs: RefObject<{[colName:string]: HTMLInputElement|null}[]>,
  feature: Feature,
  onChange: (properties:FeatureProperties, fidx:number) => void,
  handleKeyDown: (e:KeyboardEvent, row:number, col:string) => void,
}

export default function TableRow(props:TableRowProps) {
  const context = useContext(DataContext);
  const [className, setClassName] = useState(props.feature.properties["geotab:selectionStatus"] ?? "inactive");
  if (context !== null) {
    context.setFeatureListener(props.feature.id, "table", (f) => setClassName(f.properties["geotab:selectionStatus"]))
  }
  const handleCellChange = (value:any, column:Column) => {
    const newFeatureProperties = {...props.feature.properties, [column.name]: value};
    props.onChange(newFeatureProperties, props.fidx);
  };
  return (
    <tr
      onContextMenu={() => console.log(props.feature)}
      onClick={(e) => {
        props.feature.properties["geotab:selectionStatus"] = toggleActive(props.feature.properties["geotab:selectionStatus"]);
        setClassName(props.feature.properties["geotab:selectionStatus"]);
        const mapListener = context?.featureListeners[props.feature.id]?.["map"];
        if (mapListener !== undefined) {
          mapListener(props.feature);
        }
      }}
      onMouseOver={(e) => {
        props.feature.properties["geotab:selectionStatus"] = addHover(props.feature.properties["geotab:selectionStatus"]);
        setClassName(props.feature.properties["geotab:selectionStatus"]);
        const mapListener = context?.featureListeners[props.feature.id]?.["map"];
        if (mapListener !== undefined) {
          mapListener(props.feature);
        }
      }}
      onMouseOut={(e) => {
        props.feature.properties["geotab:selectionStatus"] = removeHover(props.feature.properties["geotab:selectionStatus"]);
        setClassName(props.feature.properties["geotab:selectionStatus"]);
        const mapListener = context?.featureListeners[props.feature.id]?.["map"];
        if (mapListener !== undefined) {
          mapListener(props.feature);
        }
      }}
      className={className}
      >
      <th>
        {props.fidx}
        <RowContextMenu
          feature={props.feature}
          index={props.fidx}
          >
            <MoreHorizIcon className="inlineIcon" />
        </RowContextMenu>
      </th>
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
    </tr>
  );
}