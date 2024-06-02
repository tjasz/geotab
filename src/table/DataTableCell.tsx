import { KeyboardEvent, RefObject, FocusEvent } from "react";
import DataCellValue from "./DataCellValue";
import { Column } from "../column";
import { TableCell } from "@mui/material";

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
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    props.onChange(e.target.value, props.column);
  };

  if (props.disabled) {
    return (
      <TableCell>
        <DataCellValue value={props.value} column={props.column} />
      </TableCell>
    );
  }
  return (
    <TableCell>
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
        defaultValue={props.value ?? ""}
        size={props.value?.length ?? 17 + 3}
        onBlur={handleBlur}
      />
    </TableCell>
  );
}
