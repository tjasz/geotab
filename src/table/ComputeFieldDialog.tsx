import {useState} from 'react'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Form } from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';
import { Expression, fromJsonLogic, toJsonLogic } from '../json-logic/root';
import { AdditionalOperation, RulesLogic } from 'json-logic-js';

type ComputeFieldDialogProps = {
  defaultValue:RulesLogic<AdditionalOperation>;
  schema:RJSFSchema;
  onCancel:{():void};
  onConfirm:{(draft:RulesLogic<AdditionalOperation>):void};
  open:boolean;
  title:string;
  cancelLabel?:string;
  confirmLabel?:string;
}

export function ComputeFieldDialog(props:ComputeFieldDialogProps) {
  const [ draft, setDraft] = useState(fromJsonLogic(props.defaultValue));

  const handleCancel = () => {
    props.onCancel();
  };

  const handleConfirm = () => {
    props.onConfirm(toJsonLogic(draft));
  };
  
  return (
    <Dialog onClose={handleCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <Form
          formData={draft}
          schema={props.schema}
          validator={validator}
          onChange={(e) => {
            setDraft(e.formData);
          } }
          />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{props.cancelLabel ?? "Cancel"}</Button>
        <Button onClick={handleConfirm}>{props.confirmLabel ?? "Confirm"}</Button>
      </DialogActions>
    </Dialog>
  );
}