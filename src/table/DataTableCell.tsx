import DataCellValue from './DataCellValue'

export default function TableCell(props) {
  const handleBlur = (e) => {
    props.onChange(e.target.value, props.column);
  };

  if (props.disabled) {
    return (
      <td>
        <DataCellValue value={props.value} column={props.column} />
      </td>
    );
  }
  return (
    <td>
      <input
        ref={el => {
          if (!props.cellRefs.current.hasOwnProperty(props.fidx)) {
            props.cellRefs.current[props.fidx] = {};
          }
          props.cellRefs.current[props.fidx][props.column.name] = el
        }}
        onKeyDown={(e) => props.handleKeyDown(e, props.fidx, props.column.name)}
        type="text"
        defaultValue={props.value ?? ""}
        size={props.value?.length ?? 17 + 3}
        onBlur={handleBlur}
        />
    </td>
  );
}