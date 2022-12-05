import {useState} from 'react'
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import {sleep} from './algorithm.js'

export function TextFieldDialog(props) {
  const [ draft, setDraft] = useState(props.defaultValue);

  const handleCancel = () => {
    props.onClose(props.defaultValue);
  };

  const handleConfirm = () => {
    props.onClose(draft);
  };
  
  return (
    <Dialog onClose={handleCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="columnName"
          label="Name"
          type="text"
          fullWidth
          onChange={(e) => setDraft(e.target.value)}
          value={draft ?? ""}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              handleConfirm();
            }
          }}
          onFocus={(e) => {sleep(25).then(() => { e.target.focus(); e.target.select()})}}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{props.cancelLabel ?? "Cancel"}</Button>
        <Button onClick={handleConfirm}>{props.confirmLabel ?? "Confirm"}</Button>
      </DialogActions>
    </Dialog>
  );
}