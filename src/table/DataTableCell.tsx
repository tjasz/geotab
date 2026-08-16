import { KeyboardEvent, RefObject, FocusEvent } from "react";
import DataCellValue from "./DataCellValue";
import { Column } from "../column";
import CompactTableCell from "./CompactTableCell";

type TableCellProps = {
  column: Column;
  disabled: boolean;
  value: any;
  fidx: number;
  cellRefs: RefObject<{ [colName: string]: HTMLInputElement | null }[]>;
  handleKeyDown: (e: KeyboardEvent, row: number, col: string) => void;
  onChange: (val: string, col: Column) => void;
};

export default function DataTableCell(props: TableCellProps) {
  const isObject = typeof props.value === "object" && props.value !== null;
  const editText = isObject ? JSON.stringify(props.value) ?? "" : props.value ?? "";

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    props.onChange(isObject ? JSON.parse(e.target.value) ?? "" : e.target.value, props.column);
  };

  if (props.disabled) {
    return (
      <CompactTableCell>
        <DataCellValue value={props.value} column={props.column} />
      </CompactTableCell>
    );
  }
  return (
    <CompactTableCell>
      <input
        ref={(el) => {
          if (props.cellRefs.current != null) {
            if (!props.cellRefs.current.hasOwnProperty(props.fidx)) {
              props.cellRefs.current[props.fidx] = {};
            }
            props.cellRefs.current[props.fidx][props.column.name] = el;
          }
        }}
        onKeyDown={(e) => props.handleKeyDown(e, props.fidx, props.column.name)}
        type="text"
        defaultValue={editText}
        size={editText.length ?? 17 + 3}
        onBlur={handleBlur}
      />
    </CompactTableCell>
  );
}
