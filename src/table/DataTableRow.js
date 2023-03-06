import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DataTableCell from './DataTableCell'
import RowContextMenu from './RowContextMenu';

export default function TableRow(props) {
  const handleCellChange = (value, column) => {
    const newFeatureProperties = {...props.feature.properties, [column.name]: value};
    props.onChange(newFeatureProperties, props.fidx);
  };
  return (
    <tr
      onContextMenu={() => console.log(props.feature)}
      onClick={() => props.setActive(props.feature.id)}
      className={props.active ? "active" : ""}
      >
      <th>
        {1+props.fidx}
        <RowContextMenu>
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