import React, {useContext, useState} from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import {DataContext} from './dataContext.js'
import {evaluateFilter} from './filter.js'
import {sleep} from './algorithm.js'
import { AbridgedUrlLink } from './common-components.js';
import { CommitableTextField } from './CommitableTextField.js';

function TableView(props) {
  return (
    <div id="tableview" style={props.style}>
      <DataTable />
    </div>
  );
}

function sortBy(features, sorting) {
  const [col, asc] = sorting;
  const fsort = (a, b) => {
    let av = a.properties[col.name];
    let bv = b.properties[col.name];
    if (col.type === "number") {
      av = Number(av);
      bv = Number(bv);
    }
    if (col.type === "date") {
      av = new Date(Date.parse(av));
      bv = new Date(Date.parse(bv));
    }
    if (av === bv) {
      return 0;
    } else if (av < bv) {
      return asc ? -1 : 1;
    }
    return asc ? 1 : -1;
  }
  features.sort(fsort);
}


function DataTable() {
  const context = useContext(DataContext);
  if (!context.data) return null;
  const features = context.data.filter((row) => evaluateFilter(row, context.filter));
  if (context.sorting !== null) {
    sortBy(features, context.sorting);
  }
  return (
    <table id="data-table" cellSpacing={0}>
      <tbody>
        <TableHeader columns={context.columns} sorting={context.sorting} setSorting={context.setSorting} />
        {features.map((feature, fidx) =>
          <TableRow
            key={fidx}
            columns={context.columns}
            fidx={fidx}
            feature={feature}
            active={context.active !== null && feature.hash === context.active}
            setActive={context.setActive} />)}
      </tbody>
    </table>
  );
}

function RenameColumnDialog(props) {
  const { onClose, defaultValue, open } = props;
  const [ draft, setDraft] = useState(defaultValue);

  const handleCancel = () => {
    onClose(defaultValue);
  };

  const handleConfirm = () => {
    onClose(draft);
  };

  return (
    <Dialog onClose={handleCancel} open={open}>
      <DialogTitle>Rename column '{defaultValue}'</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="columnName"
          label="Name"
          type="text"
          fullWidth
          onChange={(e) => setDraft(e.target.value)}
          defaultValue={defaultValue}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              handleConfirm();
            }
          }}
          onFocus={(e) => {sleep(25).then(() => { e.target.focus(); e.target.select()})}}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleConfirm}>Rename</Button>
      </DialogActions>
    </Dialog>
  );
}

function ColumnContextMenu(props) {
  const context = useContext(DataContext);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  
  const setInvisible = (fieldname) => {
    context.setColumns(context.columns.map((col) => col.name === fieldname ? {...col, visible: false} : col));
  };
  const deleteColumn = (fieldname) => {
    // delete from column list
    context.setColumns(context.columns.filter((col) => col.name !== fieldname));
    // delete from data as well
    context.setData(context.data.map((feature) => { let {[fieldname]: _, ...rest} = feature.properties; return {...feature, properties: rest}; }));
  };
  const renameColumn = (oldname, newname) => {
    if (oldname === newname) return;
    // rename in the column list
    context.setColumns(context.columns.map((col) => col.name === oldname ? {...col, name: newname} : col));
    // rename in the data as well
    context.setData(context.data.map((feature) => { let {[oldname]: _, ...rest} = feature.properties; return {...feature, properties: {...rest, [newname]: feature.properties[oldname]}}; }));
  };
  const swapColumns = (i1, i2) => {
    if (i1 < 0 || i2 < 0 || i1 >= context.columns.length || i2 >= context.columns.length) return;
    context.setColumns(context.columns.map((col, i) =>
      i === i1 ? context.columns[i2] : i === i2 ? context.columns[i1] : col));
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
      <span onClick={handleContextMenu} style={{ cursor: 'context-menu' }}>
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
          onClick={() => { setRenameDialogOpen(true); handleClose() }}>
          <ListItemIcon>
            <DriveFileRenameOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setInvisible(props.columnName); handleClose() }}>
          <ListItemIcon>
            <VisibilityOffIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Hide</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { swapColumns(props.columnIndex, props.columnIndex-1); handleClose() }}>
          <ListItemIcon>
            <WestIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Shift left</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { swapColumns(props.columnIndex, props.columnIndex+1); handleClose() }}>
          <ListItemIcon>
            <EastIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Shift right</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { deleteColumn(props.columnName); handleClose() }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      <RenameColumnDialog
        defaultValue={props.columnName}
        open={renameDialogOpen}
        onClose={(newname) => { renameColumn(props.columnName, newname); setRenameDialogOpen(false); }}
      />
    </React.Fragment>
  );
}

function TableHeader(props) {
  return (
    <tr>
      <th></th>
      {Array.from(props.columns).filter((column) => column.visible).map((column, idx) =>
        <th key={column.name} >
          <span onClick={() => {
            props.setSorting([column, (props.sorting && props.sorting[0].name === column.name) ? !props.sorting[1] : true]);
          }}>
            {column.name}
          </span>
          <ColumnContextMenu columnName={column.name} columnIndex={idx}>
            <MoreVertIcon className="inlineIcon" />
          </ColumnContextMenu>
        </th>)}
    </tr>
  );
}

function TableRow(props) {
  return (
    <tr onClick={() => props.setActive(props.feature.hash)} className={props.active ? "active" : ""}>
      <th>{1+props.fidx}</th>
      {Array.from(props.columns).filter((column) => column.visible).map((column) =>
        <TableCell key={`${column.name}`} column={column} value={props.feature.properties[column.name]} rowIndex={props.fidx} />)}
    </tr>
  );
}

function TableCell(props) {
  const context = useContext(DataContext);
  const setValue = (v) => {
    context.setData(context.data.map((feature, i) => i === props.rowIndex
      ? {...feature, properties: {...feature.properties, [props.column.name]: v}}
      : feature
      ));
  };
  return (
    <td>
      <CommitableTextField
        value={props.value}
        onCommit={setValue}
        CheckedInView={<CellValue value={props.value} column={props.column} />}
        />
    </td>
  );
}

function CellValue(props) {
  return (
    props.value !== null && props.value !== undefined &&
    (typeof props.value === "string" && props.value.startsWith("http")
      ? <AbridgedUrlLink target="_blank" href={props.value} length={21} />
      : props.column.type === "number"
        ? Number(props.value)
        : props.column.type === "date"
          ? new Date(Date.parse(props.value)).toISOString()
          : props.value
    )
  );
}

export default TableView;