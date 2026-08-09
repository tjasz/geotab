import { TableCell, TableCellProps } from "@mui/material";

export default function CompactTableCell({ sx, ...props }: TableCellProps) {
  return <TableCell size="small" sx={{ padding: "2px", ...sx }} {...props} />;
}
