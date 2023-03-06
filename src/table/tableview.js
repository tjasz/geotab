import DataTable from './DataTable'

export default function TableView(props) {
  return (
    <div id="tableview" style={props.style}>
      <DataTable />
    </div>
  );
}