import {useRef, useState} from 'react'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

type DriveFile = {
  id:string,
  mimeType:string,
  name:string,
  modifiedByMeTime:string,
  size:number
};
type PropertyDefinition = {
  id:string,
  name:string,
  visible:boolean,
  display:(v:any) => string
}
const FileSizePrefixes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
const driveFileProperties:PropertyDefinition[] = [
  {
    id:"id",
    name:"ID",
    visible:false,
    display:(v:string) => v
  },
  {
    id:"mimeType",
    name:"MIME Type",
    visible:false,
    display:(v:string) => v
  },
  {
    id:"name",
    name:"Name",
    visible:true,
    display:(v:string) => v
  },
  {
    id:"modifiedByMeTime",
    name:"Modified By Me",
    visible:true,
    display:(v:string) => v
  },
  {
    id:"size",
    name:"Size",
    visible:true,
    display:(v:string) => {
      let n = Number(v);
      let powerOf1024 = 0;
      while (n > 1024) {
        n = n / 1024;
        powerOf1024++;
      }
      return Math.round(n).toString() + " " + FileSizePrefixes[powerOf1024];
    }
  },
]

export function GoogleDrivePickerDialog(props) {
  const ref = useRef<HTMLElement>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);

  const handleCancel = () => {
    props.onCancel();
  };

  const handleConfirm = (file:DriveFile) => {
    props.onConfirm(file);
  };
  
  const getFiles = () => {
    if (!props.open || props.client === undefined) {
      return;
    }
    props.client.drive.files.list(
      {
        'pageSize': 1000,
        'fields': `files(${driveFileProperties.map((p) => p.id).join(',')})`
      }
    ).then(
      response => setFiles(response.result.files)
    )
  }
  getFiles();
  
  return (
    <Dialog onClose={handleCancel} open={props.open}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent ref={ref}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              {driveFileProperties
                .filter((prop) => prop.visible)
                .map((prop) =>
                  <th key={prop.id}>{prop.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {files.map((f, i) =>
            <tr key={f.id}
              onClick={() => handleConfirm(f)}
              >
              <td>{i+1}</td>
              {driveFileProperties
                .filter((prop) => prop.visible)
                .map((prop) =>
                  <td key={prop.id}>{prop.display(f[prop.id])}</td>)}
            </tr>
            )}
          </tbody>
        </table>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{props.cancelLabel ?? "Cancel"}</Button>
      </DialogActions>
    </Dialog>
  );
}