import PropTypes from 'proptypes';
import React, { Component } from 'react';
import { HashRouter, Route } from "react-router-dom";
import Index from 'js/components/Index.js';
import Rating from 'js/components/Rating.js';
import Finished from 'js/components/Finished.js';

const Root = () => (
  <HashRouter>
    <span>
      <Route exact path="/" component={Index} />
      <Route path="/rate" component={Rating} />
      <Route path="/finished" component={Finished} />
    </span>
  </HashRouter>
)

export default Root;
