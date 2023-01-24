import {useState} from 'react'
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import {sleep} from './algorithm'

export function TextFieldDialog(props) {
  const [ draft, setDraft] = useState(props.defaultValue);

  const handleCancel = () => {
    props.onCancel();
  };

  const handleConfirm = () => {
    props.onConfirm(draft);
  };
  
  return (
    <Dialog onClose={handleCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={props.label}
          type="text"
          fullWidth
          multiline={props.multiline ?? false}
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