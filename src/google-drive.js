import React, { useCallback, useContext, useState } from 'react';
import { gapi } from 'gapi-script';
import CircularProgress from '@mui/material/CircularProgress';
import { parseGoogleFile } from './readfile';
import {DataContext} from './dataContext'
import {TextFieldDialog} from './TextFieldDialog'
import {GoogleDrivePickerDialog} from './GoogleDriverPickerDialog'

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
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [listDocumentsVisible, setListDocumentsVisibility] = useState(false);
  const [listDocumentsMode, setListDocumentsMode] = useState("read");
  const [documents, setDocuments] = useState([]);
  const [isLoadingGoogleDriveApi, setIsLoadingGoogleDriveApi] = useState(false);
  const [isFetchingGoogleDriveFiles, setIsFetchingGoogleDriveFiles] = useState(false);
  const [signedInUser, setSignedInUser] = useState();
  const [accessToken, setAccessToken] = useState();
  const [openFile, setOpenFile] = useState(null);
  const [pickerInitialized, setPickerInitialized] = useState(false);
  const handleChange = (file) => {};

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
      setAccessToken(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse(true).access_token);
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
    setListDocumentsVisibility(false);
    gapi.auth2.getAuthInstance().signOut();
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
    gapi.load('picker', onPickerApiLoad);
  };

  function onPickerApiLoad() {
    setPickerInitialized(true);
  }

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
    setShowNewFileDialog(false);
    upload({name: filename}, (uploadResult) => setOpenFile(uploadResult));
  }

  const saveOpenFile = () => {
    upload(openFile);
  }

  const closeFile = () => {
    setOpenFile(null);
    context.setDataAndFilter([], null);
    context.setColumns([]);
    context.setActive(null);
    context.setSymbology(null);
  }

  const onFileSelected = (file) => {
    process([file]);
    setOpenFile(file);
    setListDocumentsVisibility(false);
  }

  const listFiles = () => {
    setListDocumentsVisibility(true);
  }

  return (
    <div>
      <h4>Google Drive</h4>
      <GoogleDrivePickerDialog
        client={gapi.client}
        onConfirm={onFileSelected}
        onCancel={() => {setListDocumentsVisibility(false)}}
        title="Open Google Drive File"
        open={listDocumentsVisible}
        />
      {signedInUser
      ? <div id="signinStatus">
          Signed in as: {signedInUser.getEmail()}
          <button onClick={handleSignOutClick}>Sign Out</button>
        </div>
      : <button onClick={handleClientLoad}>Sign In</button>
      }
      {openFile &&
        <p>Open file: {openFile.name}</p>}
      {signedInUser &&
        <span>
          {context.data.length === 0 && <button onClick={() => { listFiles(); }}>Open</button>}
          {openFile &&
            <React.Fragment>
              <button onClick={saveOpenFile}>Save</button>
              <button onClick={closeFile}>Close</button>
            </React.Fragment>
            }
          <button onClick={() => {setShowNewFileDialog(true)}}>Save New</button>
        </span>
      }
      <TextFieldDialog
        open={showNewFileDialog}
        onCancel={() => setShowNewFileDialog(false)}
        onConfirm={saveNewFile}
        title="Create File"
        label="File Name"
        confirmLabel="Create"
        />
    </div>
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