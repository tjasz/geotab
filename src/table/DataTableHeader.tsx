import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuIcon from '@mui/icons-material/Menu';
import TableContextMenu from './TableContextMenu';
import ColumnContextMenu from './ColumnContextMenu'
import {Sorting} from './sorting'
import {Column} from '../column'

type DataTableHeaderProps = {
  disabled: boolean,
  setDisabled: (v:boolean) => void
  columns: Column[],
  setColumns: (cols:Column[]) => void,
  sorting?: Sorting,
  setSorting: (sorting:Sorting|undefined) => void,
}

export default function DataTableHeader(props:DataTableHeaderProps) {
  return (
    <tr>
      <th className="tableCorner">
        <TableContextMenu
          disabled={props.disabled}
          setDisabled={props.setDisabled}
          columns={props.columns}
          setColumns={props.setColumns}
          >
            <MenuIcon />
        </TableContextMenu>
      </th>
      {Array.from(props.columns).map((column, idx) => {return {column, idx}}).filter((info) => info.column.visible).map((info) =>
        <th key={info.column.name} >
          <span onClick={() => {
            props.setSorting({col: info.column, asc: (props.sorting && props.sorting.col.name === info.column.name) ? !props.sorting.asc : true});
          }}>
            {info.column.name}
          </span>
          <ColumnContextMenu columnName={info.column.name} columnIndex={info.idx} columnFormula={info.column.formula} setSorting={props.setSorting}>
            <MoreVertIcon className="inlineIcon" />
          </ColumnContextMenu>
        </th>)}
    </tr>
  );
}