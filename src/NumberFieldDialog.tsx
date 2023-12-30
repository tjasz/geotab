import {useState} from 'react'
import Button from '@mui/material/Button';
import { Unstable_NumberInput as NumberInput } from '@mui/base/Unstable_NumberInput';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

type NumberFieldDialogProps = {
  defaultValue:number;
  onCancel:{():void};
  onConfirm:{(draft:number):void};
  open:boolean;
  title:string;
  label:string;
  cancelLabel?:string;
  confirmLabel?:string;
}

export function NumberFieldDialog(props:NumberFieldDialogProps) {
  const [ draft, setDraft] = useState(props.defaultValue);

  const handleCancel = () => {
    props.onCancel();
  };

  const handleConfirm = () => {
    props.onConfirm(draft ?? props.defaultValue);
  };
  
  return (
    <Dialog onClose={handleCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <label htmlFor="numberFieldInput">{props.label}</label>
        <input type="number" id="numberFieldInput" name="numberFieldInput"
          onChange={(ev) => setDraft(parseInt(ev.target.value))}
          value={draft ?? props.defaultValue}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              handleConfirm();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{props.cancelLabel ?? "Cancel"}</Button>
        <Button onClick={handleConfirm}>{props.confirmLabel ?? "Confirm"}</Button>
      </DialogActions>
    </Dialog>
  );
}