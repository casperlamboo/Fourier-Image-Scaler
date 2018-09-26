import PropTypes from 'proptypes';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import injectSheet from 'react-jss';
import Body from 'js/components/Body.js';
import textMarkup from 'js/jss/textMarkup.js';
import ReactMarkdown from 'react-markdown';
import content from 'md/finished.md';
import { Link } from "react-router-dom";

const style = {
  ...textMarkup
};

class App extends Component {
  static propTypes = {
    classes: PropTypes.objectOf(PropTypes.string)
  };

  render() {
    const { classes } = this.props;

    return (
      <Body>
        <div className={classes.text}>
          <ReactMarkdown source={content} />
        </div>
      </Body>
    );
  }
}

export default injectSheet(style)(App);
