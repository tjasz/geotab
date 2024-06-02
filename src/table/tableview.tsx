import DataTable from "./DataTable";
import CSS from "csstype";

type TableViewProps = {
  style: CSS.Properties;
};

export default function TableView(props: TableViewProps) {
  return (
    <div id="tableview" style={props.style}>
      <DataTable />
    </div>
  );
}
