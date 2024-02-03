import {useState} from 'react'
import ReactAce from 'react-ace';
import { Draft07, JsonError } from "json-schema-library";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

type JsonFieldDialogProps<T> = {
  defaultValue?:T;
  schema?: Draft07;
  onCancel:{():void};
  onConfirm:{(draft:T):void};
  open:boolean;
  title:string;
  description?: JSX.Element;
  cancelLabel?:string;
  confirmLabel?:string;
}

export function JsonFieldDialog<T>(props:JsonFieldDialogProps<T>) {
  const [ draft, setDraft] = useState(props.defaultValue !== null ? JSON.stringify(props.defaultValue, null, 2) : null);

  const handleCancel = () => {
    props.onCancel();
  };

  const handleConfirm = () => {
    try {
      const value = JSON.parse(draft ?? "null");
      if (props.schema) {
        const errors: JsonError[] = props.schema.validate(value);
        if (errors.length) {
          alert(errors.map(e => e.message).join("\n"));
          return;
        }
      }
      props.onConfirm(value);
    }
    catch (e) {
      if (e instanceof SyntaxError) {
        alert(e.message);
      } else {
        throw e;
      }
    }
  };
  
  return (
    <Dialog onClose={handleCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        {props.description}
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