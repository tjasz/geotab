import React, {useContext, useEffect, useRef, useState} from 'react';
import SortIcon from '@mui/icons-material/Sort';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DataObjectIcon from '@mui/icons-material/DataObject';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import { sortBy } from './algorithm.js'
import {DataContext} from './dataContext.js'
import {evaluateFilter} from './filter.js'
import { AbridgedUrlLink } from './common-components.js';
import { SelectDialog } from './SelectDialog.js'
import { TextFieldDialog } from './TextFieldDialog.js'
import {InsertLeftIcon} from './icon/InsertLeftIcon.js'
import {InsertRightIcon} from './icon/InsertRightIcon.js'
import {SortAscendingIcon} from './icon/SortAscendingIcon.js'

function TableView(props) {
  return (
    <div id="tableview" style={props.style}>
      <DataTable />
    </div>
  );
}

function DataTable() {
  const context = useContext(DataContext);
  const [sorting, setSorting] = useState(null);
  const [disabled, setDisabled] = useState(true);

  const features = context.filteredData;
  const refs = useRef({});
  // useEffect to update the ref on data update
  useEffect(() => {
    refs.current = {};
  }, [context.columns]);

  if (!context.filteredData) return null;

  const handleKeyDown = (e, row, col) => {
    // lock table using Ctrl+S
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setDisabled(true);
    }
    // paste using Ctrl+V
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const target = refs.current?.[row]?.[col];
      if (target) {
        navigator.clipboard.readText().then((result) => {
          const pasteTable = result.replaceAll('\r', '').split('\n').map((r) => r.split('\t'));
          const baseColIdx = context.columns.findIndex((c) => c.name === col);
          const newFeatures = context.filteredData
            .map((feature, fidx) => {
            if (fidx >= row && fidx < row + pasteTable.length) {
              const pasteRow = fidx - row;
              const newProperties = pasteTable[pasteRow].reduce((acc, v, i) => {
                if (baseColIdx + i < context.columns.length) {
                  const colName = context.columns[baseColIdx+i].name;
                  refs.current[fidx][colName].value = v;
                  return {...acc, [colName]: v};
                }
                return acc;
              }, feature.properties);
              return {...feature, properties: newProperties};
            } else {
              return feature;
            }
          });
          const updatedData = context.data.map((feature) => {
            const replacement = newFeatures.find((newf) => newf.id === feature.id);
            return replacement ?? feature;
          })
          context.setData(updatedData);
        })
      }
    }
    // use arrows/enter to navigate cells
    let focusTarget = null;
    if (refs.current?.[row]?.[col]) {
      if (e.key === 'Down' || e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
        focusTarget = refs.current[Math.min(row+1, features.length-1)][col];
      } else if (e.key === 'Up' || e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
        focusTarget = refs.current[Math.max(row-1, 0)][col];
      }
      if (focusTarget) {
        e.preventDefault();
        focusTarget.focus();
        focusTarget.select();
      }
    }
  }
  const handleSortingChange = (newSorting) => {
    if (context.sorting && newSorting &&
      context.sorting[0] === newSorting[0] &&
      context.sorting[1] === newSorting[1]) {
      return;
    }
    setSorting(newSorting);
    context.setData(sortBy(context.data, newSorting).slice());
  };
  const handleRowChange = (newRow, idx) => {
    const newFeatures = context.data.map((f) => f.id === features[idx].id ? {...f, properties: newRow} : f);
    context.setData(newFeatures);
  };

  return (
    <table id="data-table" cellSpacing={0}>
      <tbody>
        <TableHeader columns={context.columns} sorting={sorting} setSorting={handleSortingChange} disabled={disabled} setDisabled={setDisabled} />
        {features.map((feature, fidx) =>
          <TableRow
            key={feature.id}
            cellRefs={refs}
            handleKeyDown={handleKeyDown}
            columns={context.columns}
            fidx={fidx}
            feature={feature}
            rowId={feature.id}
            onChange={handleRowChange}
            active={context.active !== null && feature.id === context.active}
            setActive={context.setActive}
            disabled={disabled}
            />)}
      </tbody>
    </table>
  );
}

function ColumnContextMenu(props) {
  const context = useContext(DataContext);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [retypeDialogOpen, setRetypeDialogOpen] = React.useState(false);
  const [insertDialog, setInsertDialog] = React.useState(null);
  
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
  const retypeColumn = (name, newtype) => {
    // retype in the column list
    context.setColumns(context.columns.map((col) => col.name === name ? {...col, type: newtype} : col));
  };
  const swapColumns = (i1, i2) => {
    if (i1 < 0 || i2 < 0 || i1 >= context.columns.length || i2 >= context.columns.length) return;
    context.setColumns(context.columns.map((col, i) =>
      i === i1 ? context.columns[i2] : i === i2 ? context.columns[i1] : col));
  };
  const insertColumn = (i, name) => {
    if (i <= 0) {
      context.setColumns(
        [{name, visible: true, type: "string"},
        ...context.columns]);
    } else {
      context.setColumns([...context.columns.slice(0,i),
        {name, visible: true, type: "string"},
        ...context.columns.slice(i,context.columns.length)]);
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
          onClick={() => { props.setSorting({col: context.columns.find((c) => c.name === props.columnName), asc: true}); handleClose() }}>
          <ListItemIcon>
            <SortAscendingIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sort Ascending</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { props.setSorting({col: context.columns.find((c) => c.name === props.columnName), asc: false}); handleClose() }}>
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
          onClick={() => { deleteColumn(props.columnName); handleClose() }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { alert(JSON.stringify(context.columns.find((c) => c.name === props.columnName))); handleClose() }}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Metadata</ListItemText>
        </MenuItem>
      </Menu>
      <SelectDialog
        title={`Change data type of column '${props.columnName}'?`}
        label="Type"
        confirmLabel="Change"
        defaultValue={context.columns[props.columnIndex].type}
        options={["date", "number", "string"]}
        open={retypeDialogOpen}
        onClose={(newtype) => { retypeColumn(props.columnName, newtype); setRetypeDialogOpen(false); }}
      />
      <TextFieldDialog
        title={`Rename column '${props.columnName}'?`}
        label="Name"
        confirmLabel="Rename"
        defaultValue={props.columnName}
        open={renameDialogOpen}
        onClose={(newname) => { renameColumn(props.columnName, newname); setRenameDialogOpen(false); }}
      />
      <TextFieldDialog
        title={`Insert column ${insertDialog} of '${props.columnName}'?`}
        confirmLabel="Insert"
        defaultValue={null}
        open={insertDialog !== null}
        onClose={(newname) => {
          insertColumn(props.columnIndex + (insertDialog === "left" ? 0 : 1), newname);
          setInsertDialog(null); }}
      />
    </React.Fragment>
  );
}

function TableHeader(props) {
  return (
    <tr>
      <th>
        <IconButton
          aria-label={`${props.disabled ? "un" : ""}lock table`}
          onClick={() => props.setDisabled(!props.disabled)}
          edge="end"
          >
          {props.disabled ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
        </IconButton>
      </th>
      {Array.from(props.columns).filter((column) => column.visible).map((column, idx) =>
        <th key={column.name} >
          <span onClick={() => {
            props.setSorting({col: column, asc: (props.sorting && props.sorting.col.name === column.name) ? !props.sorting.asc : true});
          }}>
            {column.name}
          </span>
          <ColumnContextMenu columnName={column.name} columnIndex={idx} setSorting={props.setSorting}>
            <MoreVertIcon className="inlineIcon" />
          </ColumnContextMenu>
        </th>)}
    </tr>
  );
}

function TableRow(props) {
  const handleCellChange = (value, column) => {
    const newFeatureProperties = {...props.feature.properties, [column.name]: value};
    props.onChange(newFeatureProperties, props.fidx);
  };
  return (
    <tr
      onContextMenu={() => console.log(props.feature)}
      onClick={() => props.setActive(props.feature.id)}
      className={props.active ? "active" : ""}
      >
      <th>{1+props.fidx}</th>
      {Array.from(props.columns).filter((column) => column.visible).map((column) =>
        <TableCell
          key={`${props.rowId}:${column.name}`}
          cellRefs={props.cellRefs}
          handleKeyDown={props.handleKeyDown}
          column={column}
          fidx={props.fidx}
          value={props.feature.properties[column.name]}
          onChange={handleCellChange}
          disabled={props.disabled}
          />)}
    </tr>
  );
}

function TableCell(props) {
  const handleBlur = (e) => {
    props.onChange(e.target.value, props.column);
  };

  if (props.disabled) {
    return (
      <td>
        <CellValue value={props.value} column={props.column} />
      </td>
    );
  }
  return (
    <td>
      <input
        ref={el => {
          if (!props.cellRefs.current.hasOwnProperty(props.fidx)) {
            props.cellRefs.current[props.fidx] = {};
          }
          props.cellRefs.current[props.fidx][props.column.name] = el
        }}
        onKeyDown={(e) => props.handleKeyDown(e, props.fidx, props.column.name)}
        type="text"
        defaultValue={props.value ?? ""}
        size={props.value?.length ?? 17 + 3}
        onBlur={handleBlur}
        />
    </td>
  );
}

function CellValue(props) {
  return (
    props.value !== null && props.value !== undefined &&
    (props.value === "" ? undefined :
      typeof props.value === "string" && props.value.startsWith("http")
      ? <AbridgedUrlLink target="_blank" href={props.value} length={21} />
      : props.column.type === "number"
        ? Number(props.value)
        : props.column.type === "date"
          ? new Date(Date.parse(props.value)).toISOString()
          : typeof props.value === "string" || typeof props.value === "number"
            ? props.value
            : JSON.stringify(props.value)
    )
  );
}

export default TableView;