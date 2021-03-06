import PropTypes from 'proptypes';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import injectSheet from 'react-jss';
import Body from 'js/components/Body.js';
import textMarkup from 'js/jss/textMarkup.js';
import ReactMarkdown from 'react-markdown';
import content from 'md/index.md';
import { Link } from "react-router-dom";

const style = {
  ...textMarkup,
  content: {
    maxWidth: '800px'
  }
};

class App extends Component {
  static propTypes = {
    classes: PropTypes.objectOf(PropTypes.string)
  };

  render() {
    const { classes } = this.props;

    return (
      <Body>
        <div className={`${classes.text} ${classes.content}`}>
          <ReactMarkdown source={content} />
        </div>
        <Link to="/rate">
          <Button variant="contained" color="primary">Start</Button>
        </Link>
      </Body>
    );
  }
}

export default injectSheet(style)(App);
