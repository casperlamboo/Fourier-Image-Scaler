import PropTypes from 'proptypes';
import React, { Component } from 'react';
import { BrowserRouter, Route } from "react-router-dom";
import Index from 'js/components/Index.js';
import Rating from 'js/components/Rating.js';
import Finished from 'js/components/Finished.js';

const Root = () => (
  <BrowserRouter>
    <span>
      <Route exact path="/" component={Index} />
      <Route path="/rate" component={Rating} />
      <Route path="/finished" component={Finished} />
    </span>
  </BrowserRouter>
)

export default Root;
