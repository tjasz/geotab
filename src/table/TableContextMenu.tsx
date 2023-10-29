import React, {useState, MouseEvent, PropsWithChildren} from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { CheckListDialog } from './../CheckListDialog';
import {MousePosition} from '../MousePosition'
import {Column} from '../column'

type TableContextMenuProps = {
  disabled: boolean,
  setDisabled: (disabled:boolean) => void,
  columns: Column[],
  setColumns: (columns:Column[]) => void,
};

export default function TableContextMenu(props:PropsWithChildren<TableContextMenuProps>) {
  const [contextMenu, setContextMenu] = useState<MousePosition|null>(null);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const handleContextMenu = (event:MouseEvent) => {
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
          onClick={() => { props.setDisabled(!props.disabled); handleClose() }}>
          <ListItemIcon>
            {props.disabled ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{props.disabled ? "Unl" : "L"}ock Values</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setVisibilityOpen(true); handleClose() }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Set Visible Columns</ListItemText>
        </MenuItem>
      </Menu>
      <CheckListDialog
        open={visibilityOpen}
        onCancel={() => setVisibilityOpen(false)}
        onConfirm={(draft:Column[]) => { props.setColumns(draft); setVisibilityOpen(false)}}
        defaultValue={props.columns}
        title="Select Visible Columns"
        labelColumn="name"
        checkedColumn="visible"
        />
    </React.Fragment>
  );
}