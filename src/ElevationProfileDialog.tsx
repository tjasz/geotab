import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import ElevationProfile from './ElevationProfile';

interface ElevationProfileDialogProps {
  open: boolean;
  onClose: () => void;
  geometry: any;
  featureName?: string;
}

const ElevationProfileDialog: React.FC<ElevationProfileDialogProps> = ({
  open,
  onClose,
  geometry,
  featureName
}) => {
  const title = featureName ? `Elevation Profile: ${featureName}` : 'Elevation Profile';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      aria-labelledby="elevation-profile-dialog-title"
    >
      <DialogTitle id="elevation-profile-dialog-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div style={{ width: '100%' }}>
          <ElevationProfile geometry={geometry} useResponsiveContainer={true} height={400} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ElevationProfileDialog;