import React, { useState } from 'react';
import { createControlComponent } from '@react-leaflet/core';
import L from 'leaflet';
import SymbologyDialog from './SymbologyDialog';

interface FormatPaintButtonControlOptions extends L.ControlOptions {
  onClick?: (map: L.Map) => void;
}

// Create a custom Leaflet control with the FormatPaint icon
class FormatPaintButtonControl extends L.Control {
  protected _container: HTMLElement | null = null;
  protected _onClick: ((map: L.Map) => void) | null = null;

  constructor(options: FormatPaintButtonControlOptions) {
    super(options);
    this._onClick = options.onClick || null;
  }

  onAdd(map: L.Map): HTMLElement {
    // Create control container with custom class name
    const container = L.DomUtil.create('div', 'leaflet-control leaflet-bar format-paint-control');
    this._container = container;

    // Create button
    const button = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
    button.href = '#';
    button.title = 'Symbology Settings';
    button.role = 'button';
    button.setAttribute('aria-label', 'Map Symbology Settings');

    // Create the icon
    const iconDiv = document.createElement('div');
    iconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4H9v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h8V4h-3z"/>
    </svg>`;
    button.appendChild(iconDiv.firstChild as Node);

    // Add events
    L.DomEvent.on(button, 'click', L.DomEvent.stop);
    L.DomEvent.on(button, 'click', () => {
      if (this._onClick) {
        this._onClick(map);
      }
    });

    // Prevent text selection
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    return container;
  }

  onRemove(): void {
    if (this._container) {
      L.DomEvent.off(this._container);
      this._container = null;
    }
  }
}

// Create a React component that renders the FormatPaint icon and dialog
export function FormatPaintControl(props: L.ControlOptions): JSX.Element {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // Create a React component for the Leaflet control
  const Control = createControlComponent<FormatPaintButtonControl, FormatPaintButtonControlOptions>((props) =>
    new FormatPaintButtonControl({
      ...props,
      onClick: handleClick,
    })
  );

  return (
    <>
      <Control position={props.position || 'topright'} />
      {isDialogOpen && <SymbologyDialog open={isDialogOpen} onClose={handleCloseDialog} />}
    </>
  );
}

export default FormatPaintControl;