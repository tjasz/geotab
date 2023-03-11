import {KeyboardEvent, RefObject, useContext} from 'react'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DataTableCell from './DataTableCell'
import RowContextMenu from './RowContextMenu';
import {Column} from './../column'
import {Feature, FeatureProperties} from './../geojson-types'
import {onMouseOver, onMouseOut, onMouseClick} from '../selection'
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
  const handleCellChange = (value:any, column:Column) => {
    const newFeatureProperties = {...props.feature.properties, [column.name]: value};
    props.onChange(newFeatureProperties, props.fidx);
  };
  return (
    <tr
      onContextMenu={() => console.log(props.feature)}
      onClick={(e) => { context?.setData(onMouseClick.bind(null, props.feature.id)) }}
      onMouseOver={(e) => { context?.setData(onMouseOver.bind(null, props.feature.id)) }}
      onMouseOut={(e) => { context?.setData(onMouseOut.bind(null, props.feature.id)) }}
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