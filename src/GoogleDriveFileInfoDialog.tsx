import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import {DriveFile, driveFileProperties} from './GoogleDriveFile'

type FileInfoDialogProperties = {
  open:boolean,
  file:DriveFile,
  handleClose:()=>void
}

export function GoogleDriveFileInfoDialog(props:FileInfoDialogProperties) {
  return (
    <Dialog onClose={props.handleClose} open={props.open}>
      <DialogTitle>File Info</DialogTitle>
      <DialogContent>
        {props.file &&
        <table id="fileInfoDialog">
          <tbody>
            {driveFileProperties
                  .filter((prop) => prop.visible)
                  .map((prop) =>
                    <tr key={prop.id}>
                      <th>
                        {prop.name}
                      </th>
                      <td>
                        {prop.display(props.file[prop.id])}
                      </td>
                    </tr>)}
          </tbody>
        </table>}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}