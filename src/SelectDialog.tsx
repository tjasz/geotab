import {useState} from 'react'
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

type SelectDialogProps = {
  defaultValue:string;
  onCancel:{():void};
  onConfirm:{(draft:string):void};
  open:boolean;
  title:string;
  options:string[];
  label:string;
  cancelLabel:string;
  confirmLabel:string;
}

export function SelectDialog(props:SelectDialogProps) {
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
        <Select
          autoFocus
          value={draft ?? props.options[0]}
          label={props.label}
          onChange={(e) => setDraft(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              handleConfirm();
            }
          }}
        >
          {props.options.map((opt) =>
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{props.cancelLabel ?? "Cancel"}</Button>
        <Button onClick={handleConfirm}>{props.confirmLabel ?? "Confirm"}</Button>
      </DialogActions>
    </Dialog>
  );
}