import React from 'react';

function TableView(props) {
      return (
        <div id="tableview" style={props.style}>
          <table id="data-table" cellSpacing={0}>
            <tbody>
              <tr>
                <th>Name</th>
                <th>Lat</th>
                <th>Lon</th>
              </tr>
              <tr>
                <td>Seattle</td>
                <td>47.5</td>
                <td>-122.3</td>
              </tr>
              <tr>
                <td>Null Island</td>
                <td>0</td>
                <td>0</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

export default TableView;