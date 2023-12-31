import React, {useContext, MouseEvent, PropsWithChildren} from 'react';
import CalculateIcon from '@mui/icons-material/Calculate';
import DataObjectIcon from '@mui/icons-material/DataObject';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import EastIcon from '@mui/icons-material/East';
import InfoIcon from '@mui/icons-material/Info';
import SortIcon from '@mui/icons-material/Sort';
import WestIcon from '@mui/icons-material/West';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ColumnMetadataDialog } from './ColumnMetadataDialog';
import {DataContext} from './../dataContext'
import { SelectDialog } from './../SelectDialog'
import { TextFieldDialog } from './../TextFieldDialog'
import {SortAscendingIcon} from './../icon/SortAscendingIcon'
import {InsertLeftIcon} from './../icon/InsertLeftIcon'
import {InsertRightIcon} from './../icon/InsertRightIcon'
import { FieldTypeDescription } from '../fieldtype';
import { Feature } from '../geojson-types';
import { MousePosition } from '../MousePosition';
import {Sorting} from './sorting'
import {ComputeFieldDialog} from './ComputeFieldDialog'
import { getSchema } from '../json-logic/rjsf';
import { AdditionalOperation, apply, RulesLogic } from 'json-logic-js';

type InsertDialog = "left"|"right"|null;

type ColumnContextMenuProps = {
  columnName: string,
  columnIndex: number,
  columnFormula?: RulesLogic<AdditionalOperation>,
  setSorting: (sorting:Sorting|undefined) => void,
}

export default function ColumnContextMenu(props:PropsWithChildren<ColumnContextMenuProps>) {
  const context = useContext(DataContext);
  const [contextMenu, setContextMenu] = React.useState<MousePosition|null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [retypeDialogOpen, setRetypeDialogOpen] = React.useState(false);
  const [calculateDialogOpen, setCalculateDialogOpen] = React.useState(false);
  const [insertDialog, setInsertDialog] = React.useState<InsertDialog>(null);
  const [columnMetadataOpen, setColumnMetadataOpen] = React.useState(false);
  
  const setInvisible = (fieldname:string) => {
    if (context === null) return;
    context.setColumns(context.columns.map((col) => col.name === fieldname ? {...col, visible: false} : col));
  };
  const deleteColumn = (fieldname:string) => {
    if (context === null) return;
    // delete from column list
    context.setColumns(context.columns.filter((col) => col.name !== fieldname));
    // delete from data as well
    context.setData(context.data.map((feature) => { let {[fieldname]: _, ...rest} = feature.properties; return {...feature, properties: rest}; }));
  };
  const renameColumn = (oldname:string, newname:string) => {
    if (context === null) return;
    if (oldname === newname) return;
    // rename in the column list
    context.setColumns(context.columns.map((col) => col.name === oldname ? {...col, name: newname} : col));
    // rename in the data as well
    context.setData(context.data.map((feature) => { let {[oldname]: _, ...rest} = feature.properties; return {...feature, properties: {...rest, [newname]: feature.properties[oldname]}}; }));
  };
  const retypeColumn = (name:string, newtype:FieldTypeDescription) => {
    if (context === null) return;
    // retype in the column list
    context.setColumns(context.columns.map((col) => col.name === name ? {...col, type: newtype} : col));
  };
  const calculateColumn = (name:string, formula:RulesLogic<AdditionalOperation>) => {
    if (context === null) return;
    try {
      if (formula !== undefined) {
        context.setColumns(context.columns.map((column) => {
          return column.name == name
            ? {...column, formula}
            : column;
        }));
        context.setData(context.data.map((feature, index) => {
          let {[name]: _, ...rest} = feature.properties;
          return {...feature, properties: {...rest, [name]: apply(formula, {feature, index, features: context.filteredData})}};
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
  const swapColumns = (i1:number, i2:number) => {
    if (context === null) return;
    if (i1 < 0 || i2 < 0 || i1 >= context.columns.length || i2 >= context.columns.length) return;
    context.setColumns(context.columns.map((col, i) =>
      i === i1 ? context.columns[i2] : i === i2 ? context.columns[i1] : col));
  };
  const insertColumn = (i:number, name:string) => {
    if (context === null) return;
    if (i <= 0) {
      context.setColumns(
        [{name, visible: true, type: FieldTypeDescription.String},
        ...context.columns]);
    } else {
      context.setColumns([...context.columns.slice(0,i),
        {name, visible: true, type: FieldTypeDescription.String},
        ...context.columns.slice(i,context.columns.length)]);
    }
  };

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
          onClick={() => {
            const column = context?.columns.find((c) => props.columnName === c.name);
            props.setSorting(context && column ? {col: column, asc: true} : undefined);
            handleClose()
            }}>
          <ListItemIcon>
            <SortAscendingIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sort Ascending</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const column = context?.columns.find((c) => props.columnName === c.name);
            props.setSorting(context && column ? {col: column, asc: false} : undefined);
            handleClose()
            }}>
          <ListItemIcon>
            <SortIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sort Descending</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setRenameDialogOpen(true); handleClose() }}>
          <ListItemIcon>
            <DriveFileRenameOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setRetypeDialogOpen(true); handleClose() }}>
          <ListItemIcon>
            <DataObjectIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Type</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setCalculateDialogOpen(true); handleClose() }}>
          <ListItemIcon>
            <CalculateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Calculate</ListItemText>
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
          onClick={() => { setInsertDialog("left"); handleClose() }}>
          <ListItemIcon>
            <InsertLeftIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Insert left</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setInsertDialog("right"); handleClose() }}>
          <ListItemIcon>
            <InsertRightIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Insert right</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setInvisible(props.columnName); handleClose() }}>
          <ListItemIcon>
            <VisibilityOffIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Hide</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { deleteColumn(props.columnName); handleClose() }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { setColumnMetadataOpen(true); handleClose() }}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Metadata</ListItemText>
        </MenuItem>
      </Menu>
      {context &&
        <ColumnMetadataDialog
          open={columnMetadataOpen}
          onClose={() => setColumnMetadataOpen(false)}
          column={context.columns.find((c) => props.columnName === c.name)}
          data={context.filteredData.map((row) => row.properties[props.columnName])}
          />
      }
      <SelectDialog
        title={`Change data type of column '${props.columnName}'?`}
        label="Type"
        confirmLabel="Change"
        defaultValue={context?.columns[props.columnIndex].type}
        options={["date", "number", "string"]}
        open={retypeDialogOpen}
        onConfirm={(newtype) => { retypeColumn(props.columnName, newtype as FieldTypeDescription); setRetypeDialogOpen(false); }}
        onCancel={() => setRetypeDialogOpen(false)}
      />
      <TextFieldDialog
        title={`Rename column '${props.columnName}'?`}
        label="Name"
        confirmLabel="Rename"
        defaultValue={props.columnName}
        open={renameDialogOpen}
        onConfirm={(newname) => { renameColumn(props.columnName, newname); setRenameDialogOpen(false); }}
        onCancel={() => { setRenameDialogOpen(false); }}
      />
      <ComputeFieldDialog
        title={`Calculate values for column '${props.columnName}'`}
        confirmLabel="Calculate"
        defaultValue={props.columnFormula
          ? props.columnFormula
          : { var : `feature.properties.${props.columnName}` }}
        schema={getSchema(context?.columns ?? [])}
        open={calculateDialogOpen}
        onConfirm={(formula) => { calculateColumn(props.columnName, formula); setCalculateDialogOpen(false); }}
        onCancel={() => { setCalculateDialogOpen(false); }}
      />
      <TextFieldDialog
        title={`Insert column ${insertDialog} of '${props.columnName}'?`}
        label="New Column Name"
        confirmLabel="Insert"
        open={insertDialog !== null}
        onConfirm={(newname) => {
          insertColumn(props.columnIndex + (insertDialog === "left" ? 0 : 1), newname);
          setInsertDialog(null); }}
        onCancel={() => setInsertDialog(null)}
      />
    </React.Fragment>
  );
}