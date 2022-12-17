import React, { useCallback, useContext, useState } from 'react';
import { gapi } from 'gapi-script';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { parseGoogleFile } from './readfile';
import {DataContext} from './dataContext.js'

// Client ID and API key from the Developer Console
const CLIENT_ID = "717055595652-4n93oosqls3l4q3oa0jik4s154qbk149.apps.googleusercontent.com";
const API_KEY = "AIzaSyBCJBiyP5g5JLzk9so8I6ujWd583t63lL8";

// Array of API discovery doc URLs for APIs
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// TODO can support .FIT?
const fileTypes = ['application/json', 'text/csv', 'application/gpx+xml', 'application/vnd.google-apps.spreadsheet'];
const fileTypesFilter = `(${fileTypes.map((t) => `mimeType = '${t}'`).join(" or ")})`;

export function GoogleLogin(props) {
  const context = useContext(DataContext);
  const [listDocumentsVisible, setListDocumentsVisibility] = useState(false);
  const [listDocumentsMode, setListDocumentsMode] = useState("read");
  const [documents, setDocuments] = useState([]);
  const [isLoadingGoogleDriveApi, setIsLoadingGoogleDriveApi] = useState(false);
  const [isFetchingGoogleDriveFiles, setIsFetchingGoogleDriveFiles] = useState(false);
  const [signedInUser, setSignedInUser] = useState();
  const [accessToken, setAccessToken] = useState();
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
   * Print files.
   */
  const listFiles = (searchTerm = fileTypesFilter) => {
    setIsFetchingGoogleDriveFiles(true);
    gapi.client.drive.files
      .list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
        q: searchTerm,
      })
      .then(function (response) {
        setIsFetchingGoogleDriveFiles(false);
        setListDocumentsVisibility(true);
        const res = JSON.parse(response.body);
        setDocuments(res.files);
      });
  };

  const getFileContents = (id) => {
    setIsFetchingGoogleDriveFiles(true);
    gapi.client.drive.files
      .get({ fileId: id, alt: 'media'})
      .then((response) => props.onRead(JSON.parse(response.body)))
      .catch((e) => console.error(e));
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

  const showDocuments = () => {
    setListDocumentsVisibility(true);
  };

  const onDialogClose = () => {
    setListDocumentsVisibility(false);
  };

  const onDialogConfirm = (files) => {
    if (listDocumentsMode === "read") {
      process(files)
    } else {
      upload(files[0]);
    }
    setListDocumentsVisibility(false);
  };

  const upload = (file) => {
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
    insertFile(file, textContent)
  };

  const onPicker = (data) => {
    if (data[window.google.picker.Response.ACTION] !== window.google.picker.Action.PICKED) return;
    if (listDocumentsMode === "read") {
      process(data[window.google.picker.Response.DOCUMENTS])
    } else {
      upload(data[window.google.picker.Response.DOCUMENTS][0]);
    }
    setListDocumentsVisibility(false);
  };

  // Create and render a Google Picker object for selecting from Drive
  const showPicker = (mode) => {
    const view = new window.google.picker.DocsView()
        .setMimeTypes(fileTypes.join());
    const builder = new window.google.picker.PickerBuilder()
        .addView(view)
        .setSelectableMimeTypes(fileTypes.join())
        .setOAuthToken(accessToken)
        .setDeveloperKey(API_KEY)
        .setCallback(onPicker);
    if (mode === "read") {
      builder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);
    }
    const picker = builder.build();
    picker.setVisible(true);
  }

  return (
    <div>
      <div>
        <h4>Google Drive</h4>
        {isLoadingGoogleDriveApi || isFetchingGoogleDriveFiles
          ? <CircularProgress />
          : signedInUser
          ? <span>
            <p>Signed in as: {signedInUser.getEmail()}</p>
            <button onClick={() => {setListDocumentsMode("read"); showPicker("read")}}>Select Files</button>
            <button onClick={handleSignOutClick}>Sign Out</button>
            <button onClick={() => {setListDocumentsMode("write"); showPicker("write")}}>Upload</button>
          </span>
          : <span>
            <p>Import data from your Google Drive.</p>
            <button onClick={handleClientLoad}>Sign In</button>
          </span>}
      </div>
    </div>
  );
}

function insertFile(file, text, callback) {
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  var contentType = 'application/json';
  var metadata = {
    'name': file?.name ?? "geotabExport.json",
    'mimeType': contentType
  };

  var multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n' +
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