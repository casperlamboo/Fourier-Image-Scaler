import jss from 'jss';
import preset from 'jss-preset-default';
import normalize from 'normalize-jss';

jss.setup(preset());
jss.createStyleSheet(normalize).attach();
jss.createStyleSheet({
  '@global': {
    '*': { margin: 0, padding: 0 },
    '#app, body, html': { height: '100%', fontFamily: 'sans-serif' }
  }
}).attach();

import { AppContainer } from 'react-hot-loader';
import { render } from 'react-dom';
import React from 'react';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import Root from './Root.js';

render(
  <AppContainer>
    <Root/>
  </AppContainer>,
  document.getElementById('app')
);

if (module.hot) {
  module.hot.accept('./Root.js', () => {
    const NewRoot = require('./Root.js').default;
    render(
      <AppContainer>
        <Root/>
      </AppContainer>,
      document.getElementById('app')
    );
  });
}
