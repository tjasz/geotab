import React, { useCallback, useContext, useState } from 'react';
import { gapi } from 'gapi-script';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOffIcon from '@mui/icons-material/FolderOff';
import { parseGoogleFile } from './readfile';
import {DataContext} from './dataContext'
import {TextFieldDialog} from './TextFieldDialog'
import {GoogleDrivePickerDialog} from './GoogleDriverPickerDialog'
import {GoogleDriveFileInfoDialog} from './GoogleDriveFileInfoDialog'

// Client ID and API key from the Developer Console
const CLIENT_ID = "717055595652-4n93oosqls3l4q3oa0jik4s154qbk149.apps.googleusercontent.com";
const API_KEY = "AIzaSyBCJBiyP5g5JLzk9so8I6ujWd583t63lL8";

// Array of API discovery doc URLs for APIs
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// TODO can support .FIT?
// Since scope is limited to drive.file, only open the file type that is saved by this app.
const FILE_TYPE = "application/json+geotab";
// These would be possible to open if scope was full "drive"
// const fileTypes = ['application/json', 'text/csv', 'application/gpx+xml', 'application/vnd.google-apps.spreadsheet'];

export function GoogleLogin(props) {
  const context = useContext(DataContext);
  // dialog/menu visibility booleans
  const [newFileDialogVisible, setNewFileDialogVisible] = useState(false);
  const [filePickerVisible, setFilePickerVisible] = useState(false);
  // signin/file status
  const [isLoadingGoogleDriveApi, setIsLoadingGoogleDriveApi] = useState(false);
  const [isFetchingGoogleDriveFile, setIsFetchingGoogleDriveFile] = useState(false);
  const [isSavingGoogleDriveFile, setIsSavingGoogleDriveFile] = useState(false);
  const [signedInUser, setSignedInUser] = useState();
  const [openFile, setOpenFile] = useState(null);

  const process = (files) => {
    const promises = [];
    for (let i = 0; i < files.length; i++) {
      promises.push(parseGoogleFile(files[i]));
    }
    Promise.allSettled(promises)
    .then((results) => {
      const jsons = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const features = jsons.filter((j) => j !== null);
      const json = features.length > 1 ? { type: "FeatureCollection", features } : features[0];
      props.onRead(json);
      const errors = results.filter((r) => r.status === "rejected").map((r) => r.reason);
      errors.length && alert(errors);
      setIsFetchingGoogleDriveFile(false);
    })
    .catch((e) => {
      alert(e);
    })
    ;
  };
  
  /**
   *  Sign in the user upon button click.
   */
  const handleAuthClick = (event) => {
    gapi.auth2.getAuthInstance().signIn();
  };

  /**
   *  Called when the signed in status changes, to update the UI
   *  appropriately. After a sign-in, the API is called.
   */
   const updateSigninStatus = (isSignedIn) => {
    if (isSignedIn) {
      // Set the signed in user
      setSignedInUser(gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile());
      setIsLoadingGoogleDriveApi(false);
    } else {
      // prompt user to sign in
      handleAuthClick();
    }
  };

  /**
   *  Sign out the user upon button click.
   */
  const handleSignOutClick = (event) => {
    setFilePickerVisible(false);
    gapi.auth2.getAuthInstance().signOut();
    setSignedInUser(null);
    setOpenFile(null);
  };

  /**
   *  Initializes the API client library and sets up sign-in state
   *  listeners.
   */
  const initClient = () => {
    setIsLoadingGoogleDriveApi(true);
    gapi.client
      .init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES,
      })
      .then(
        function () {
          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

          // Handle the initial sign-in state.
          updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        },
        function (error) {}
      );
  };

  const handleClientLoad = () => {
    gapi.load('client:auth2', initClient);
  };

  const upload = (file, callback) => {
    const textContent = JSON.stringify({
      type: "FeatureCollection",
      // TODO option to save filtered or unfiltered data
      features: context.data,
      geotabMetadata: {
        columns: context.columns,
        filter: context.filter,
        symbology: context.symbology
      }
    });
    insertFile(textContent, file, callback)
  };

  const saveNewFile = (filename) => {
    setNewFileDialogVisible(false);
    setIsSavingGoogleDriveFile(true);
    upload({name: filename}, (uploadResult) => {setOpenFile(uploadResult); setIsSavingGoogleDriveFile(false)});
  }

  const saveOpenFile = () => {
    setIsSavingGoogleDriveFile(true);
    upload(openFile, () => setIsSavingGoogleDriveFile(false));
  }

  const closeFile = () => {
    setOpenFile(null);
    context.setDataAndFilter([], null);
    context.setColumns([]);
    context.setSymbology(null);
  }

  const onFileSelected = (file) => {
    setIsFetchingGoogleDriveFile(true);
    process([file]);
    setOpenFile(file);
    setFilePickerVisible(false);
  }

  const listFiles = () => {
    setFilePickerVisible(true);
  }

  return (
    <div>
      <GoogleDrivePickerDialog
        client={gapi.client}
        onConfirm={onFileSelected}
        onCancel={() => {setFilePickerVisible(false)}}
        title="Open Google Drive File"
        open={filePickerVisible}
        />
      {signedInUser &&
        <FileContextMenu
          canOpen={context.data.length === 0 && openFile === null}
          canSaveNew={context.data.length > 0}
          openFile={openFile}
          onOpen={listFiles}
          onClose={closeFile}
          onSave={saveOpenFile}
          onSaveNew={() => {setNewFileDialogVisible(true)}}
          >
          <FileButton
            isFetchingGoogleDriveFile={isFetchingGoogleDriveFile}
            isSavingGoogleDriveFile={isSavingGoogleDriveFile}
            canSaveNew={context.data.length > 0}
            openFile={openFile}
            />
        </FileContextMenu>
      }
      <UserButton
        isLoading={isLoadingGoogleDriveApi}
        signedInUser={signedInUser}
        handleSignOutClick={handleSignOutClick}
        handleSignInClick={handleClientLoad}
        />
      <TextFieldDialog
        open={newFileDialogVisible}
        onCancel={() => setNewFileDialogVisible(false)}
        onConfirm={saveNewFile}
        title="Create File"
        label="File Name"
        confirmLabel="Create"
        />
    </div>
  );
}

function FileButton(props) {
  if (props.isFetchingGoogleDriveFile) {
    return <button id="fileStatus">
             <CircularProgress size={36} />
             <p>Loading...</p>
           </button>
  }
  if (props.isSavingGoogleDriveFile) {
    return <button id="fileStatus">
             <CircularProgress size={36} />
             <p>Saving...</p>
           </button>
  }
  if (props.openFile) {
    return <button id="fileStatus">
             <FolderIcon fontSize="large" />
             <p>{props.openFile.name}</p>
           </button>
  }
  return <button id="fileStatus">
           <FolderOffIcon fontSize="large" />
           <p>{props.canSaveNew ? "Create" : "Open"}</p>
         </button>
}

function UserButton(props) {
  return props.isLoading
    ? <button
        onClick={props.handleSignOutClick}
        id="signinStatus">
        <CircularProgress size={36} />
        <p>Signing in...</p>
      </button>
    : props.signedInUser
      ? <button
          onClick={props.handleSignOutClick}
          id="signinStatus">
          <PersonIcon
            fontSize="large"
            />
          <p>{props.signedInUser.getEmail()}</p>
        </button>
      : <button
          onClick={props.handleSignInClick}
          id="signinStatus">
          <PersonOffIcon
            fontSize="large"
            />
          <p>Sign In</p>
        </button>
}

function FileContextMenu(props) {
  const [contextMenu, setContextMenu] = useState(null);
  const [fileInfoDialogOpen, setFileInfoDialogOpen] = useState(false);
  const handleContextMenu = (event) => {
    if (props.canOpen) {
      props.onOpen();
    } else if (props.canSaveNew && props.openFile === null) {
      props.onSaveNew();
    } else {
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
    }
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
          disabled={!props.canOpen}
          onClick={() => { props.onOpen(); handleClose() }}>
          <ListItemText>Open</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={props.openFile === null}
          onClick={() => { props.onClose(); handleClose() }}>
          <ListItemText>Close</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={props.openFile === null}
          onClick={() => { props.onSave(); handleClose() }}>
          <ListItemText>Save</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={!props.canSaveNew}
          onClick={() => { props.onSaveNew(); handleClose() }}>
          <ListItemText>Save New</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={props.openFile === null}
          onClick={() => { setFileInfoDialogOpen(true); handleClose() }}>
          <ListItemText>Info</ListItemText>
        </MenuItem>
      </Menu>
      <GoogleDriveFileInfoDialog
        open={fileInfoDialogOpen}
        file={props.openFile}
        handleClose={() => setFileInfoDialogOpen(false)}
        />
    </React.Fragment>
  );
}

function insertFile(text, file, callback) {
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  var metadata = {
    'name': file?.name ?? "geotabExport.json",
    'mimeType': FILE_TYPE,
  };
  if (!metadata.name.endsWith('json')) {
    metadata.name += '.json';
  }

  var multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n' +
      '\r\n' +
      text +
      close_delim;

  var request = gapi.client.request({
      'path': '/upload/drive/v3/files' + (file?.id ? `/${file.id}` : ''),
      'method': file?.id ? 'PATCH' : 'POST',
      'params': {'uploadType': 'multipart'},
      'headers': {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
      },
      'body': multipartRequestBody});
  if (!callback) {
    callback = function(file) {
      console.log(file)
    };
  }
  request.execute(callback);
}