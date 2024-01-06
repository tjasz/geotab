import {useState} from 'react'
import ReactAce from 'react-ace';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

type JsonFieldDialogProps = {
  defaultValue?:string;
  onCancel:{():void};
  onConfirm:{(draft:string):void};
  open:boolean;
  title:string;
  multiline?:boolean;
  label:string;
  cancelLabel?:string;
  confirmLabel?:string;
}

export function JsonFieldDialog(props:JsonFieldDialogProps) {
  const [ draft, setDraft] = useState(props.defaultValue);

  const handleCancel = () => {
    props.onCancel();
  };

  const handleConfirm = () => {
    props.onConfirm(draft ?? "");
  };
  
  return (
    <Dialog onClose={handleCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <ReactAce
          mode="json"
          theme="github"
          focus
          onChange={(s) => setDraft(s)}
          value={draft ?? ""}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{props.cancelLabel ?? "Cancel"}</Button>
        <Button onClick={handleConfirm}>{props.confirmLabel ?? "Confirm"}</Button>
      </DialogActions>
    </Dialog>
  );
}