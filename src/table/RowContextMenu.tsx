import React, {useContext, PropsWithChildren} from 'react';
import CalculateIcon from '@mui/icons-material/Calculate';
import DeleteIcon from '@mui/icons-material/Delete';
import StraightenIcon from '@mui/icons-material/Straighten';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {DataContext} from './../dataContext';
import {Feature} from '../geojson-types'
import {MousePosition} from '../MousePosition'
import { simplify } from '../geojson-calc';
import { DataObject } from '@mui/icons-material';
import { AdditionalOperation, apply, RulesLogic } from 'json-logic-js';
import { getSchema } from '../json-logic/schema';
import { JsonFieldDialog } from '../JsonFieldDialog';
import { Draft07 } from 'json-schema-library';
import { geojsonGeometrySchema } from '../geojson-schema'

type RowContextMenuProps = {
  feature: Feature,
  index: number,
}

export default function RowContextMenu(props:PropsWithChildren<RowContextMenuProps>) {
  const context = useContext(DataContext);
  const [contextMenu, setContextMenu] = React.useState<MousePosition|null>(null);
  const [editGeometryOpen, setEditGeometryOpen] = React.useState<boolean>(false);
  const [calculateJsonDialogOpen, setCalculateJsonDialogOpen] = React.useState<boolean>(false);
  
  const deleteRow = () => {
    if (context === null) return;
    context.setData(context.data.filter(
      (feature) => feature.id !== props.feature.id));
  };

  const simplifyGeometry = () => {
    if (context === null) return;
    context.setData(context.data.map((feature) => feature.id !== props.feature.id ? feature : simplify(feature, 10)));
  }

  const setGeometry = (newGeometry) => {
    if (context === null) return;
    context.setData(context.data.map((feature) => feature.id !== props.feature.id ? feature : {...feature, geometry: newGeometry}));
  }

  const calculateGeometry = (formula:RulesLogic<AdditionalOperation>) => {
    if (context === null) return;
    try {
      if (formula !== undefined) {
        context.setData(context.data.map((feature, index) => {
          if (feature.id !== props.feature.id) {
            return feature;
          }

          const geometry = apply(formula, {feature, index, features: context.filteredData}).geometry;
          return {...feature, geometry };
        }));
      }
    }
    catch (error) {
      if (error instanceof SyntaxError) {
        alert(`Error parsing formula "${formula}": ${error.message}`);
      }
      else {
        throw error;
      }
    }
  };

  const handleContextMenu = (event) => {
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
          // Other native context menus might behave different.
          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
          null,
    );
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  return (
    <React.Fragment>
      <span onClick={handleContextMenu}>
        {props.children}
      </span>
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={() => { deleteRow(); handleClose() }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { simplifyGeometry(); handleClose() }}>
          <ListItemIcon>
            <StraightenIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Simplify Geometry</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setEditGeometryOpen(true); handleClose() }}>
          <ListItemIcon>
            <DataObject fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Geometry</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setCalculateJsonDialogOpen(true); handleClose() }}>
          <ListItemIcon>
            <CalculateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Compute Geometry</ListItemText>
        </MenuItem>
      </Menu>
      <JsonFieldDialog
        title="Edit Geometry"
        confirmLabel="Update"
        defaultValue={props.feature.geometry}
        schema={new Draft07(geojsonGeometrySchema)}
        open={editGeometryOpen}
        onConfirm={(newGeometry) => { setGeometry(newGeometry); setEditGeometryOpen(false); }}
        onCancel={() => { setEditGeometryOpen(false); }}
      />
      <JsonFieldDialog
        title="Calculate Geometry"
        confirmLabel="Calculate"
        defaultValue={{var: "feature"}}
        schema={new Draft07(getSchema(context?.columns ?? []))}
        open={calculateJsonDialogOpen}
        onConfirm={(formula) => { calculateGeometry(formula); setCalculateJsonDialogOpen(false); }}
        onCancel={() => { setCalculateJsonDialogOpen(false); }}
      />
    </React.Fragment>
  );
}