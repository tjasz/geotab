import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import SymbologyView from './SymbologyView';

interface SymbologyDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SymbologyDialog({ open, onClose }: SymbologyDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Map Symbology</DialogTitle>
      <DialogContent>
        <SymbologyView />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default SymbologyDialog;