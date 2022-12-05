import React, {useRef, useState} from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { sleep } from './algorithm.js'

export function CommitableTextField(props) {
  const textFieldRef = useRef(null);
  const [checkedOut, setCheckedOut] = useState(false);
  const [draft, setDraft] = useState(props.value);

  const handleCheckout = (e) => {
    setCheckedOut(true);
    const inputRef = textFieldRef.current.querySelectorAll('input[type=text]')[0];
    sleep(25).then(() => { inputRef.focus(); inputRef.select()});
  };
  const handleCancel = () => {
    setCheckedOut(false);
    setDraft(props.value);
  };
  const handleCommit = () => {
    props.onCommit(draft);
    setCheckedOut(false);
  };
  const handleChange = (e) => {
    setDraft(e.target.value);
  };

  return (
    <TextField
      ref={textFieldRef}
      size="small"
      onChange={handleChange}
      disabled={!checkedOut}
      value={draft}
      onKeyUp={(e) => {
        if (e.key === 'Enter') {
          handleCommit();
        }
      }}
      InputProps={{
        endAdornment:
          <InputAdornment position="end">
            {checkedOut
            ? <React.Fragment>
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleCancel}
                edge="end"
              >
                <CloseIcon />
              </IconButton>
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleCommit}
                edge="end"
              >
                <CheckIcon />
              </IconButton>
            </React.Fragment>
            : <IconButton
              aria-label="toggle password visibility"
              onClick={handleCheckout}
              edge="end"
              >
              <DriveFileRenameOutlineIcon />
            </IconButton>
            }
          </InputAdornment>
        }}
      />
  );
}