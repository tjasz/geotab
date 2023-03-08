import React from 'react'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import {toType} from '../fieldtype'
import { Histogram } from '../common-components';
import math from '../math';
import {Column} from '../column'
import { FieldTypeDescription } from "../fieldtype";

type ColumnMetadataDialogProps = {
  open: boolean,
  onClose: () => void,
  column: Column,
  data: any[],
}

export function ColumnMetadataDialog(props:ColumnMetadataDialogProps) {
  return (
    <Dialog onClose={props.onClose} open={props.open}>
      <DialogTitle>Column Metadata: '{props.column.name}'</DialogTitle>
      <DialogContent>
        <ColumnMetadataTable column={props.column} data={props.data} />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Dismiss</Button>
      </DialogActions>
    </Dialog>
  );
}

type ColumnMetadataTableProps = {
  column: Column,
  data: any[],
}

function ColumnMetadataTable(props:ColumnMetadataTableProps) {
  const stats = getStats(props.column, props.data);
  return (
    <React.Fragment>
      <table>
        <tbody>
          {Object.keys(stats).map((stat) => <tr key={stat}>
            <th>{prettyKey(stat)}</th>
            <td>{prettyValue(stats[stat])}</td>
          </tr>)}
        </tbody>
      </table>
      { (props.column.type === "number" || props.column.type === "date")
      && stats.minimum !== undefined
      && stats.minimum !== stats.maximum
      && <Histogram
          left={Math.floor(stats.minimum as number)}
          right={Math.ceil(stats.maximum as number)}
          binWidth={((stats.maximum as number) - (stats.minimum as number))/Math.sqrt(props.data.length)}
          values={props.data}
          viewboxHeight={50}
          />
      }
    </React.Fragment>
  );
}

function prettyKey(key:string) : string {
  // represent ordinal numbers with digits rather than text
  const ordinalStrings = {
    "fifth": "5th",
    "twentyFifth": "25th",
    "seventyFifth": "75th",
    "ninetyFifth": "95th",
  };
  for (const [text, digits] of Object.entries(ordinalStrings)) {
    key = key.replace(text, digits);
  }
  // capitalize first letter
  key = key.charAt(0).toUpperCase() + key.slice(1);
  // insert spaces before interior capital letters
  key = key.replace(/([A-Z]+)/g, ' $1').trim();
  return key;
}

function prettyValue(value:any) : JSX.Element | string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  switch(typeof value) {
    case "string":
      return value;
    // handle the counts dictionary
    case "object":
      if (value != null && !Array.isArray(value)) {
        const topRows = Object.entries(value).sort((a,b) => (b[1] as number) - (a[1] as number)).slice(0,5);
        return <table>
          <tbody>
            {topRows.map((kv) => <tr key={kv[0]}>
              <th>{kv[0]}</th>
              <td>{kv[1] as number}</td>
            </tr>)}
          </tbody>
        </table>
      }
  }
  return JSON.stringify(value);
}

type Stats = GenericStats & Partial<StringStats | NumericStats>;

type GenericStats = {
  type: FieldTypeDescription,
  count: number,
  defined?: number,
};

function getStats(column:Column, data:any[]) : Stats {
  const count = data.length;
  if (!count) {
    return {type: column.type, count};
  }
  const defined = data.filter((a) => a !== null && a !== undefined && a !== "").map((a) => toType(a, column.type));
  const genericStats:GenericStats = {type: column.type, count, defined: defined.length};
  const numberDefined = defined.length;
  if (!numberDefined) {
    return genericStats;
  }
  switch (column.type) {
    case "number":
      return {...genericStats, ...getNumericStats(defined)};
    case "date":
      const dates = defined.map((a) => a.getTime());
      const stats = getNumericStats(dates);
      Object.keys(stats).forEach((key) => { stats[key] = new Date(stats[key])});
      return {...genericStats, ...stats};
    case "string":
      return {...genericStats, ...getStringStats(defined)};
    default:
      return genericStats;
  }
}

type StringCounts = {[value:string]: number};

type StringStats = {
  minimum: string,
  maximum: string,
  counts: StringCounts,
}

function getStringStats(data:string[]) : StringStats {
  let minimum = data[0];
  let maximum = data[0];
  let counts = {[data[0]]: 1};
  for (let i = 1; i < data.length; i++) {
    if (data[i] < minimum) {
      minimum = data[i];
    }
    if (data[i] > maximum) {
      maximum = data[i];
    }
    if (counts.hasOwnProperty(data[i])) {
      counts[data[i]] += 1;
    } else {
      counts[data[i]] = 1;
    }
  }
  return {
    minimum,
    maximum,
    counts,
  };
}

type NumericStats = {
  minimum: number,
  fifthPercentile: number,
  twentyFifthPercentile: number,
  mean: number,
  median: number,
  seventyFifthPercentile: number,
  ninetyFifthPercentile: number,
  maximum: number,
}

function getNumericStats(data:number[]) : NumericStats {
  const sorted = data.slice().sort((a,b) => a -b);
  return {
    minimum: sorted[0],
    fifthPercentile: percentile(sorted, 5),
    twentyFifthPercentile: percentile(sorted, 25),
    mean: math.sum(sorted) / sorted.length,
    median: percentile(sorted, 50),
    seventyFifthPercentile: percentile(sorted, 75),
    ninetyFifthPercentile: percentile(sorted, 95),
    maximum: sorted[sorted.length - 1],
  };
}

function percentile<T>(sorted:T[], percentile:number) : T {
  const index = Math.floor(sorted.length * percentile / 100);
  return sorted[index];
}