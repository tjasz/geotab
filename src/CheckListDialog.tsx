import { useRef } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";

export function CheckListDialog(props) {
  const ref = useRef<HTMLElement>(null);

  const handleCancel = () => {
    props.onCancel();
  };

  const handleConfirm = () => {
    if (ref.current) {
      const nodes = ref.current.querySelectorAll("input");
      props.onConfirm(
        props.defaultValue.map((v, i) => {
          return { ...v, [props.checkedColumn]: nodes.item(i).checked };
        }),
      );
    }
  };

  return (
    <Dialog onClose={handleCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent ref={ref}>
        {props.defaultValue.map((v, i) => (
          <label key={v[props.labelColumn]} style={{ display: "block" }}>
            <input type="checkbox" defaultChecked={v[props.checkedColumn]} />
            {v[props.labelColumn]}
          </label>
        ))}
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
