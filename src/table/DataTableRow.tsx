import {KeyboardEvent, RefObject} from 'react'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DataTableCell from './DataTableCell'
import RowContextMenu from './RowContextMenu';
import {Column} from './../column'
import {Feature, FeatureProperties} from './../geojson-types'

type TableRowProps = {
  fidx: number,
  rowId: string,
  columns: Column[],
  disabled: boolean,
  cellRefs: RefObject<{[colName:string]: HTMLInputElement|null}[]>,
  feature: Feature,
  active: boolean,
  setActive: (fid:string) => void,
  onChange: (properties:FeatureProperties, fidx:number) => void,
  handleKeyDown: (e:KeyboardEvent, row:number, col:string) => void,
}

export default function TableRow(props:TableRowProps) {
  const handleCellChange = (value:any, column:Column) => {
    const newFeatureProperties = {...props.feature.properties, [column.name]: value};
    props.onChange(newFeatureProperties, props.fidx);
  };
  return (
    <tr
      onContextMenu={() => console.log(props.feature)}
      onClick={() => props.setActive(props.feature.id)}
      className={props.feature.properties["geotab:selectionStatus"]}
      >
      <th>
        {1+props.fidx}
        <RowContextMenu
          feature={props.feature}
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