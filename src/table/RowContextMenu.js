import React, {useContext} from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {DataContext} from './../dataContext'

export default function RowContextMenu(props) {
  const context = useContext(DataContext);
  const [contextMenu, setContextMenu] = React.useState(null);
  
  const deleteRow = (fieldname) => {
    console.log("delete row");
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
      </Menu>
    </React.Fragment>
  );
}