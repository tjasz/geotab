import {KeyboardEvent, RefObject, FocusEvent} from 'react'
import DataCellValue from './DataCellValue'
import {Column} from '../column'

type TableCellProps = {
  column:Column,
  disabled: boolean,
  value: any,
  fidx: number,
  cellRefs: RefObject<{[colName:string]: HTMLInputElement|null}[]>,
  handleKeyDown: (e:KeyboardEvent, row:number, col:string) => void,
  onChange: (val:string, col:Column) => void,
}

export default function TableCell(props:TableCellProps) {
  const handleBlur = (e:FocusEvent<HTMLInputElement>) => {
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
          if (props.cellRefs.current != null) {
            if (!props.cellRefs.current.hasOwnProperty(props.fidx)) {
              props.cellRefs.current[props.fidx] = {};
            }
            props.cellRefs.current[props.fidx][props.column.name] = el;
          }
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