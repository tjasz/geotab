import {useState} from 'react'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { RulesLogic } from 'json-logic-js';
import { Form } from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';

type ComputeFieldDialogProps = {
  defaultValue:RulesLogic;
  schema:RJSFSchema;
  onCancel:{():void};
  onConfirm:{(draft:RulesLogic):void};
  open:boolean;
  title:string;
  cancelLabel?:string;
  confirmLabel?:string;
}

export function ComputeFieldDialog(props:ComputeFieldDialogProps) {
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
        <Form
          formData={draft}
          schema={props.schema}
          validator={validator}
          onChange={(e) => console.log(e) }
          />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{props.cancelLabel ?? "Cancel"}</Button>
        <Button onClick={handleConfirm}>{props.confirmLabel ?? "Confirm"}</Button>
      </DialogActions>
    </Dialog>
  );
}