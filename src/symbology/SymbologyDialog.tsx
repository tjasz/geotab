import { useContext, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { DataContext } from '../dataContext';
import SymbologyDefinition from './SymbologyView';
import { Symbology } from './painter';

interface SymbologyDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SymbologyDialog({ open, onClose }: SymbologyDialogProps) {
  const context = useContext(DataContext);

  const [draft, setDraft] = useState(context?.symbology ?? {});

  if (context === undefined || context === null) {
    console.error('DataContext is not available');
    return null;
  }

  const handleSave = () => {
    context?.setSymbology(draft);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle onContextMenu={() => console.log(context.symbology)}>Symbology</DialogTitle>
      <DialogContent>
        <SymbologyDefinition symbology={draft} onUpdate={setDraft} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SymbologyDialog;