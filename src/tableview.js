import React from 'react';

class TableView extends React.Component {
    constructor(props) {
      super(props);
    }
  
    componentDidMount() {
    }
  
    componentWillUnmount() {
    }
  
    render() {
      return (
        <div id="tableview" style={this.props.style}>
          <table cellspacing={0}>
            <tbody>
              <tr>
                <td>Name</td>
                <td>Lat</td>
                <td>Lon</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
  }

export default TableView;