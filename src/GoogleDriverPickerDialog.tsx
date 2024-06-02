import { useRef, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { DriveFile, driveFileProperties } from "./GoogleDriveFile";

export function GoogleDrivePickerDialog(props) {
  const ref = useRef<HTMLElement>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);

  const handleCancel = () => {
    props.onCancel();
  };

  const handleConfirm = (file: DriveFile) => {
    props.onConfirm(file);
  };

  const getFiles = () => {
    if (!props.open || props.client === undefined) {
      return;
    }
    props.client.drive.files
      .list({
        pageSize: 1000,
        fields: `files(${driveFileProperties.map((p) => p.id).join(",")})`,
        q: "trashed=false and mimeType='application/json+geotab'",
      })
      .then((response) => setFiles(response.result.files));
  };
  getFiles();

  return (
    <Dialog onClose={handleCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent ref={ref}>
        <table className="pickerTable">
          <thead>
            <tr>
              <th>#</th>
              {driveFileProperties
                .filter((prop) => prop.visible)
                .map((prop) => (
                  <th key={prop.id} style={{ textAlign: prop.align }}>
                    {prop.name}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {files.map((f, i) => (
              <tr key={f.id} onClick={() => handleConfirm(f)}>
                <td>{i + 1}</td>
                {driveFileProperties
                  .filter((prop) => prop.visible)
                  .map((prop) => (
                    <td key={prop.id} style={{ textAlign: prop.align }}>
                      {prop.display(f[prop.id])}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{props.cancelLabel ?? "Cancel"}</Button>
      </DialogActions>
    </Dialog>
  );
}
