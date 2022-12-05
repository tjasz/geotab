import React, {useRef, useState} from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { sleep } from './algorithm.js'

export function CommitableTextField(props) {
  const [checkedOut, setCheckedOut] = useState(false);
  const [draft, setDraft] = useState(props.value);

  const handleCheckout = (e) => {
    setCheckedOut(true);
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

  if (!checkedOut) {
    return (
      <span>
        {props.CheckedInView ?? draft}
        <IconButton
          aria-label="edit field value"
          onClick={handleCheckout}
          edge="end"
          >
          <DriveFileRenameOutlineIcon />
        </IconButton>
      </span>
    );
  }

  return (
    <span>
      <input
        type="text"
        value={draft}
        autoFocus
        size={props.value?.length ?? 17 + 3}
        onChange={handleChange}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            handleCommit();
          }
        }}
        onFocus={(e) => e.target.select()}
        />
      <IconButton
        aria-label="cancel field edit"
        onClick={handleCancel}
        edge="end"
        >
        <CloseIcon />
      </IconButton>
      <IconButton
        aria-label="commit field edit"
        onClick={handleCommit}
        edge="end"
        >
        <CheckIcon />
      </IconButton>
    </span>
  );
}