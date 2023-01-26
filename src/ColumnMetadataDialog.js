import React from 'react'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import {toType} from './algorithm'
import { Histogram } from './common-components';
import math from './math';

export function ColumnMetadataDialog({open, onClose, column, data}) {  
  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Column Metadata: '{column.name}'</DialogTitle>
      <DialogContent>
        <ColumnMetadataTable column={column} data={data} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Dismiss</Button>
      </DialogActions>
    </Dialog>
  );
}

function ColumnMetadataTable({column, data}) {
  const stats = getStats(column, data);
  return (
    <React.Fragment>
      <table>
        <tbody>
          <tr>
            <th>Type</th>
            <td>{column.type}</td>
          </tr>
          {Object.keys(stats).map((stat) => <tr key={stat}>
            <th>{stat}</th>
            <td>{JSON.stringify(stats[stat])}</td>
          </tr>)}
        </tbody>
      </table>
      { (column.type === "number" || column.type === "date")
      && stats.Minimum !== stats.Maximum
      && <Histogram
          left={Math.floor(stats.Minimum)}
          right={Math.ceil(stats.Maximum)}
          binWidth={(stats.Maximum - stats.Minimum)/Math.sqrt(data.length)}
          values={data}
          viewboxHeight={50}
          />
      }
    </React.Fragment>
  );
}

function getStats(column, data) {
  let result = {};
  result.Count = data.length;
  if (!result.Count) {
    return result;
  }
  const defined = data.filter((a) => a !== null && a !== undefined && a !== "").map((a) => toType(a, column.type));
  result.Defined = defined.length;
  if (!result.Defined) {
    return result;
  }
  switch (column.type) {
    case "number":
      return {...result, ...getNumericStats(defined)};
    case "date":
      const dates = defined.map((a) => a.getTime());
      const stats = getNumericStats(dates);
      Object.keys(stats).forEach((key) => { stats[key] = new Date(stats[key])});
      return {...result, ...stats};
    case "string":
      result.Minimum = defined[0];
      result.Maximum = defined[0];
      result.Mode = defined[0];
      let counts = {[defined[0]]: 1};
      for (let i = 1; i < defined.length; i++) {
        if (defined[i] < result.Minimum) {
          result.Minimum = defined[i];
        }
        if (defined[i] > result.Maximum) {
          result.Maximum = defined[i];
        }
        if (counts.hasOwnProperty(defined[i])) {
          counts[defined[i]] += 1;
        } else {
          counts[defined[i]] = 1;
        }
        if (counts[defined[i]] > counts[result.Mode]) {
          result.Mode = defined[i];
        }
      }
      if (Object.keys(counts).length < 10) {
        result.Counts = counts;
      }
      result.Mode = `${result.Mode} (${counts[result.Mode]})`;
      return result;
  }
  return result;
}

function getNumericStats(data) {
  let result = {};
  const sorted = data.slice().sort((a,b) => a -b);
  result.Minimum = sorted[0];
  result["5th Percentile"] = percentile(sorted, 5);
  result["25th Percentile"] = percentile(sorted, 25);
  result.Mean = math.sum(sorted) / sorted.length;
  result.Median = percentile(sorted, 50);
  result["75th Percentile"] = percentile(sorted, 75);
  result["95th Percentile"] = percentile(sorted, 95);
  result.Maximum = sorted[sorted.length - 1];
  return result;
}

function percentile(sorted, percentile) {
  const index = Math.floor(sorted.length * percentile / 100);
  return sorted[index];
}