import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

export function ColumnMetadataDialog({open, onClose, column, data}) {  
  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Column Metadata: '{column.name}'</DialogTitle>
      <DialogContent>
        <ColumnMetadataTable column={column} data={data} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Dismiss</Button>
      </DialogActions>
    </Dialog>
  );
}

function ColumnMetadataTable({column, data}) {
  const stats = getStats(data);
  return (
    <table>
      <tbody>
        <tr>
          <th>Type</th>
          <td>{column.type}</td>
        </tr>
        {Object.keys(stats).map((stat) => <tr>
          <th>{stat}</th>
          <td>{stats[stat]}</td>
        </tr>)}
      </tbody>
    </table>
  );
}

function getStats(data) {
  let result = {};
  result.Count = data.length;
  if (!data.length) {
    return result;
  }
  result.Minimum = data[0];
  result.Maximum = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[0] < result.Minimum) {
      result.Minimum = data[0];
    }
    if (data[0] > result.Maximum) {
      result.Maximum = data[0];
    }
  }
  return result;
}