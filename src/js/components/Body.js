import PropTypes from 'proptypes';
import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import injectSheet from 'react-jss';
import { grey } from '@material-ui/core/colors';

const style = {
  body: {
    height: '100%',
    backgroundColor: grey[200],
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },
  container: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexShrink: 0,
    margin: '30px 0 40px 0'
  }
}

class Body extends Component {
  static propTypes = {
    children: PropTypes.node,
    classes: PropTypes.objectOf(PropTypes.string)
  };

  render() {
    const { classes, children } = this.props;

    return (
      <div className={classes.body}>
        <div className={classes.container}>
          <Paper style={{ padding: '30px 20px', minWidth: '800px' }}>
            {children}
          </Paper>
        </div>
      </div>
    );
  }
}

export default injectSheet(style)(Body);
