import { useRef, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
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

  const handleDelete = (e: React.MouseEvent, file: DriveFile) => {
    e.stopPropagation(); // Prevent row click from triggering
    if (window.confirm(`Are you sure you want to delete the file "${file.name}"?`)) {
      props.client.drive.files.delete({ fileId: file.id })
        .then(() => {
          // Remove the file from the local state
          setFiles(files.filter(f => f.id !== file.id));
        })
        .catch(error => {
          console.error("Error deleting file:", error);
          alert("Failed to delete the file. Please try again.");
        });
    }
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
              <th>Delete</th>
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
                <td>
                  <IconButton
                    size="small"
                    onClick={(e) => handleDelete(e, f)}
                    aria-label="delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </td>
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
