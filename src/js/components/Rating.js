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

const NUMBERS = Array.from(Array(10)).map((_, i) => i + 1);
const IMAGES = [fields, desert, milky, valley];

const style = {
  buttonBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around'
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
    step: 0
  };

  rate(index) {
    const { history } = this.props;
    let { step } = this.state;
    step ++;

    if (step === IMAGES.length) {
      history.push('/finished');
    } else {
      this.setState({ step });
    }
  }

  render() {
    const { classes } = this.props;
    const { step } = this.state;

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
          {NUMBERS.map(i => <Button
            key={i}
            variant="fab"
            color="primary"
            onClick={() => this.rate(i)}
          >{i}</Button>)}
        </div>
      </Body>
    );
  }
}

export default injectSheet(style)(App);
