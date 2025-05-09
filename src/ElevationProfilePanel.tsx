import React, { useState } from 'react';
import { Paper, IconButton, Box, Slide } from '@mui/material';
import { Close, ExpandLess, ExpandMore } from '@mui/icons-material';
import ElevationProfile from './ElevationProfile';
import { GeometryType } from './geojson-types';

interface ElevationProfilePanelProps {
  open: boolean;
  onClose: () => void;
  geometry: any;
  featureName?: string;
}

const ElevationProfilePanel: React.FC<ElevationProfilePanelProps> = ({
  open,
  onClose,
  geometry,
  featureName
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const isLineFeature = geometry?.type === GeometryType.LineString ||
    geometry?.type === GeometryType.MultiLineString;

  if (!isLineFeature) return null;

  // Check if coordinates have elevation data (z value)
  if (geometry.coordinates.length === 0 || !geometry.coordinates.some(c => c.length >= 3)) {
    return null;
  }

  const title = featureName ? `Elevation Profile: ${featureName}` : 'Elevation Profile';

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          boxShadow: '0px -2px 10px rgba(0,0,0,0.25)',
          maxHeight: expanded ? 'calc(70vh)' : '60px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out'
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: expanded ? '1px solid #e0e0e0' : 'none',
          backgroundColor: '#f5f5f5'
        }}>
          <Box sx={{ fontWeight: 'bold' }}>{title}</Box>
          <Box>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ marginRight: 1 }}
            >
              {expanded ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
            <IconButton
              size="small"
              aria-label="close"
              onClick={onClose}
            >
              <Close />
            </IconButton>
          </Box>
        </Box>

        {expanded && (
          <Box sx={{ padding: '16px', overflow: 'auto', maxHeight: 'calc(70vh - 60px)' }}>
            <ElevationProfile geometry={geometry} useResponsiveContainer={true} height={200} />
          </Box>
        )}
      </Paper>
    </Slide>
  );
};

export default ElevationProfilePanel;