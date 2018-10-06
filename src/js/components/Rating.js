import PropTypes from 'proptypes';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import injectSheet from 'react-jss';
import Body from 'js/components/Body.js';
import CircularProgress from '@material-ui/core/CircularProgress';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import fields from 'img/fields.jpg';
import desert from 'img/desert.jpg';
import milky from 'img/milky.jpg';
import valley from 'img/valley.jpg';

const IMAGES = [fields, desert, milky, valley];
const SHARPNESS_BUTTONS = [
  { key: '-2', text: 'Left is a lot sharper then Right', },
  { key: '-1', text: 'Left is a bit sharper then Right', },
  { key: '0', text: 'Left is as sharp as Right', },
  { key: '1', text: 'Right is a bit sharper then Left', },
  { key: '2', text: 'Right is a lot sharper then Left', }
];

const ARTEFACTS_BUTTONS = [
  { key: '-2', text: 'Left has a lot more artefacts then Right' },
  { key: '-1', text: 'Left has a bit more artefacts then Right' },
  { key: '0', text: 'Left has as many artefacts as Right' },
  { key: '1', text: 'Right has a bit more artefacts then Left' },
  { key: '2', text: 'Right has a lot more artefacts then Left' }
];

const style = {
  button: {
    marginTop: '10px',
    float: 'right'
  },
  buttonBar: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridColumnGap: '10px',
    justifyContent: 'space-around'
  },
  buttonContainer: {
    display: 'grid',
    gridRowGap: '5px'
  },
  imageBar: {
    display: 'grid',
    gridColumnGap: '10px',
    gridTemplateColumns: '1fr 1fr',
    margin: '0 0 20px 0',
    '& img': {
      width: '512px'
    }
  }
}

class App extends Component {
  static propTypes = {
    classes: PropTypes.objectOf(PropTypes.string)
  };

  state = {
    step: 0,
    sharpness: null,
    artefacts: null
  };

  rate() {
    const { history } = this.props;
    let { step } = this.state;
    step ++;

    if (step === IMAGES.length) {
      history.push('/finished');
    } else {
      this.setState({
        step,
        sharpness: null,
        artefacts: null
      });
    }
  }

  render() {
    const { classes } = this.props;
    const { step, sharpness, artefacts } = this.state;

    return (
      <Body>
        <Stepper activeStep={step}>
          {IMAGES.map((_, i) => (<Step key={i}><StepLabel /></Step>))}
        </Stepper>
        <div className={classes.imageBar}>
          <img src={IMAGES[step]} />
          <img src={IMAGES[step]} />
        </div>
        <div className={classes.buttonBar}>
          <div className={classes.buttonContainer}>
            <h2>Sharpness</h2>
            {SHARPNESS_BUTTONS.map(({ key, text }) => (<Button
              key={key}
              variant={sharpness === key ? 'contained' : 'outlined'}
              color="secondary"
              onClick={() => this.setState({ sharpness: key })}
            >{text}</Button>))}
          </div>
          <div className={classes.buttonContainer}>
            <h2>Artefacts</h2>
            {ARTEFACTS_BUTTONS.map(({ key, text }) => (<Button
              key={key}
              variant={artefacts === key ? 'contained' : 'outlined'}
              color="secondary"
              onClick={() => this.setState({ artefacts: key })}
            >{text}</Button>))}
          </div>
        </div>
        <Button
          onClick={() => this.rate()}
          color="primary"
          variant="contained"
          className={classes.button}
          disabled={sharpness === null || artefacts === null}
        >Next Image</Button>
      </Body>
    );
  }
}

export default injectSheet(style)(App);
