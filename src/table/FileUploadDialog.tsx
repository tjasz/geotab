import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { parseFile } from "../readfile";

type FileUploadDialogProps = {
  id: string;
  onCancel: { (): void };
  onConfirm: { (draft: any): void };
  open: boolean;
  title: string;
  description?: JSX.Element;
  cancelLabel?: string;
  confirmLabel?: string;
};

export function FileUploadDialog(props: FileUploadDialogProps) {
  const inputId = `${props.id}-file-selector`;

  const handleCancel = () => {
    props.onCancel();
  };

  const handleConfirm = () => {
    const fileSelector = document.getElementById(inputId);
    const fileHandle = (fileSelector as HTMLInputElement).files?.[0];
    if (fileHandle !== null && fileHandle !== undefined) {
      parseFile(fileHandle).then((result) => {
        props.onConfirm(result);
      });
    } else {
      alert("File not found.");
    }
  };

  return (
    <Dialog open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        {props.description}
        <input type="file" id={inputId} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{props.cancelLabel ?? "Cancel"}</Button>
        <Button onClick={handleConfirm}>
          {props.confirmLabel ?? "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
