import PropTypes from 'proptypes';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import injectSheet from 'react-jss';
import Body from 'js/components/Body.js';
import CircularProgress from '@material-ui/core/CircularProgress';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import portraitSrc from 'img/PORTRAIT.png';
import landscapeSrc from 'img/LANDSCAPE.png';
import textSrc from 'img/TEXT.png';

import { loadImage, resizeImage } from 'js/imageUtils.js';
import FourierTransform from 'js/FourierTransform.js';

const IMAGES = {
  '1.jpeg': portraitSrc,
  '2.jpeg': landscapeSrc,
  '3.jpeg': textSrc
};
const API = 'https://php5naar7.nl/images.php';
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
const IMAGES_MAP = new WeakMap();

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
    artefacts: null,
    data: false
  };

  constructor(props) {
    super(props);

    fetch(`${API}?fetchImage`, { method: 'GET' }).then(response => response.json()).then(data => {
      return Promise.all(data.map(({ filename, ...args }) => {
        return loadImage(IMAGES[filename])
          .then(image => ({ ...args, image, filename }));
      }))
    }).then(data => this.setState({ data }));;
  }

  rate() {
    const { history } = this.props;
    let { step, data, sharpness, artefacts } = this.state;
    const { filterStrength, resized, filename } = data[step];

    const url = new URL(API);
    url.searchParams.append('filterStrength', filterStrength);
    url.searchParams.append('resized', resized);
    url.searchParams.append('filename', filename);
    url.searchParams.append('sharpness', sharpness);
    url.searchParams.append('artefacts', artefacts);

    fetch(url.toString(), { method: 'GET' });

    step ++;

    if (step === data.length) {
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
    const { step, sharpness, artefacts, data } = this.state;

    if (!data) {
      return (<Body>
        <CircularProgress style={{ margin: '0 auto', display: 'block' }} />
      </Body>);
    }

    if (!IMAGES_MAP.has(data[step])) {
      IMAGES_MAP.set(data[step], createImages(data[step]));
    }
    const { originalImage, editedImage } = IMAGES_MAP.get(data[step]);

    return (
      <Body>
        <Stepper activeStep={step}>
          {data.map((_, i) => (<Step key={i}><StepLabel /></Step>))}
        </Stepper>
        <div className={classes.imageBar}>
          <img src={originalImage} />
          <img src={editedImage} />
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

const fourierTransform = new FourierTransform();
function createImages({ filename, filterStrength, resized, image }) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');

  context.drawImage(image, 0, 0);

  const originalImage = canvas.toDataURL();

  const sx = Math.max(1, Math.round(image.width * resized));
  const sy = Math.max(1, Math.round(image.height * resized));

  const imageData = context.getImageData(0, 0, image.width, image.height);
  const downSampled = resizeImage(imageData, sx, sy, 'bilinearInterpolation');
  const upSampled = resizeImage(downSampled, image.width, image.height, 'bilinearInterpolation');
  context.putImageData(upSampled, 0, 0);

  const innerRadius = image.width * resized;
  const radiusSize = image.width * resized;

  fourierTransform
    .init(canvas)
    .fft(false)
    .swap()
    .highFrequencyAmplifier(innerRadius, radiusSize, filterStrength)
    .swap()
    .fft(true)
    .drawImage(canvas);

  const editedImage = canvas.toDataURL();

  return { originalImage, editedImage };
}

export default injectSheet(style)(App);
