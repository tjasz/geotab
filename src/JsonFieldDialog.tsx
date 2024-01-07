import {useState} from 'react'
import ReactAce from 'react-ace';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

type JsonFieldDialogProps<T> = {
  defaultValue?:T;
  onCancel:{():void};
  onConfirm:{(draft:T):void};
  open:boolean;
  title:string;
  cancelLabel?:string;
  confirmLabel?:string;
}

export function JsonFieldDialog<T>(props:JsonFieldDialogProps<T>) {
  const [ draft, setDraft] = useState(props.defaultValue ? JSON.stringify(props.defaultValue, null, 2) : null);

  const handleCancel = () => {
    props.onCancel();
  };

  const handleConfirm = () => {
    props.onConfirm(JSON.parse(draft ?? "null"));
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
          tabSize={2}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{props.cancelLabel ?? "Cancel"}</Button>
        <Button onClick={handleConfirm}>{props.confirmLabel ?? "Confirm"}</Button>
      </DialogActions>
    </Dialog>
  );
}