import imageSrc1 from 'img/256.png';
import imageSrc2 from 'img/desert.jpg';
import imageSrc3 from 'img/fields.jpg';
import imageSrc4 from 'img/milky.jpg';
import imageSrc5 from 'img/valley.jpg';
import { loadImage, resizeImage } from 'js/imageUtils.js';
import FourierTransform from 'js/FourierTransform.js';

const imageSrcs = [imageSrc1, imageSrc2, imageSrc3, imageSrc4, imageSrc5];
const resizeAlgorithms = [
  { algorithm: 'nearestNeighbor', name: 'Nearest Neighbor' },
  { algorithm: 'bilinearInterpolation', name: 'Bilinear Interpolation' },
  { algorithm: 'bicubicInterpolation', name: 'Bicubic Interpolation' },
  { algorithm: 'hermiteInterpolation', name: 'Hermite Interpolation' },
  { algorithm: 'bezierInterpolation', name: 'Bezier Interpolation' }
];

document.body.innerHTML = `
  <div>
    <div style="display: flex;">
      <div>
        <h2>Controls</h2>
        <div id="sliders"></div>
      </div>
      <div>
        <h2>Original</h2>
        <div id="original" style="display: flex"></div>
      </div>
    </div>
    <div style="display: flex;">
      <div>
        <h2>Edited</h2>
        <div id="transform" style="display: flex"></div>
      </div>
    </div>
  </div>
`;

function createSlider(min, max, def) {
  const slider = document.createElement('input');
  slider.style.width = '256px';
  slider.setAttribute('type', 'range');
  slider.setAttribute('min', min);
  slider.setAttribute('max', max);
  slider.setAttribute('value', def);
  slider.setAttribute('step', (max - min) / 100);

  return slider;
}

function createCanvas() {
  const canvas = document.createElement('canvas');
  return canvas;
}

function createButton(name) {
  const button = document.createElement('button');
  button.innerHTML = name;

  return button;
}

function createSelect(options) {
  const select = document.createElement('select');

  for (const { name, value } of options) {
    const option = document.createElement('option');
    option.innerHTML = name;
    option.setAttribute('value', value);
    select.appendChild(option);
  }

  return select;
}

function appendWithLabel(id, doms, label) {
  const child = document.createElement('div');
  child.style.marginRight = "5px"

  const p = document.createElement('p');
  p.innerHTML = label;

  child.appendChild(p);
  for (const dom of doms) {
    child.appendChild(dom);
  }

  document.getElementById(id).appendChild(child);
}

Promise.all(imageSrcs.map(loadImage)).then(images => {
  let [image] = images;
  let [{ algorithm }] = resizeAlgorithms;

  let resize = 1;
  let filterStrength = 1;

  const previousButton = createButton('Previous Image');
  const nextButton = createButton('Next Image');
  appendWithLabel('sliders', [previousButton, nextButton], 'Image');

  const algoritmSelect = createSelect(resizeAlgorithms.map(({ algorithm, name }) => ({ value: algorithm, name })));
  appendWithLabel('sliders', [algoritmSelect], 'Resize Algorithm');

  const sliderResize = createSlider(0, 1, resize);
  appendWithLabel('sliders', [sliderResize], 'resize');
  const sliderFilterStrength = createSlider(0, 100, filterStrength);
  appendWithLabel('sliders', [sliderFilterStrength], 'filter strength');

  const canvasOriginal = createCanvas();
  appendWithLabel('original', [canvasOriginal], 'Original Image');
  const canvasSpectrumOriginal = createCanvas();
  appendWithLabel('original', [canvasSpectrumOriginal], 'FFT of Original Image');

  const canvasResize = createCanvas();
  appendWithLabel('transform', [canvasResize], 'Resized Image');
  const canvasSpectrumResize = createCanvas();
  appendWithLabel('transform', [canvasSpectrumResize], 'FTT of Resized Image');
  const canvasSpectrumTransformed = createCanvas();
  appendWithLabel('transform', [canvasSpectrumTransformed], 'Edited FFT');
  const canvasSpectrumReconstructed = createCanvas();
  appendWithLabel('transform', [canvasSpectrumReconstructed], 'Reconstructed Image');

  redraw(false);

  nextButton.addEventListener('click', () => {
    image = images[(images.indexOf(image) + 1) % images.length];
    redraw(false);
  });

  previousButton.addEventListener('click', () => {
    image = images[(images.indexOf(image) - 1 + images.length) % images.length];
    redraw(false);
  });

  // sliderResize.addEventListener('input', event => {
  //   resize = parseFloat(event.target.value);
  //   redraw(true);
  // });
  sliderResize.addEventListener('change', event => {
    resize = parseFloat(event.target.value);
    redraw(false);
  });

  // sliderFilterStrength.addEventListener('input', event => {
  //   filterStrength = parseFloat(event.target.value);
  //   redraw(true);
  // });
  sliderFilterStrength.addEventListener('change', event => {
    filterStrength = parseFloat(event.target.value);
    redraw(false);
  });

  algoritmSelect.addEventListener('change', event => {
    algorithm = event.target.value;
    redraw(false);
  });

  function redraw(grayScale) {
    let innerRadius = image.width * resize;
    let radiusSize = image.width * resize;

    canvasOriginal.width = canvasResize.width = image.width;
    canvasOriginal.height = canvasResize.height = image.height;

    canvasOriginal.getContext('2d').drawImage(image, 0, 0);
    canvasResize.getContext('2d').drawImage(image, 0, 0);

    const fourierTransform = new FourierTransform();
    fourierTransform
      .init(canvasOriginal)
      .fft(false)
      .swap();

    fourierTransform.drawSpectrum(true, canvasSpectrumOriginal);
    fourierTransform.drawSpectrum(true, canvasSpectrumResize);
    fourierTransform.drawSpectrum(true, canvasSpectrumTransformed);
    fourierTransform
      .swap()
      .fft(true)
      .drawImage(canvasSpectrumReconstructed);

    const sx = Math.max(1, Math.round(image.width * resize));
    const sy = Math.max(1, Math.round(image.height * resize));

    const imageData = canvasOriginal.getContext('2d').getImageData(0, 0, image.width, image.height);
    const downSampled = resizeImage(imageData, sx, sy, algorithm);
    const upSampled = resizeImage(downSampled, image.width, image.height, algorithm);
    canvasResize.getContext('2d').putImageData(upSampled, 0, 0);

    fourierTransform
      .init(canvasResize, grayScale)
      .fft(false, grayScale)
      .swap(grayScale)
      .drawSpectrum(true, canvasSpectrumResize, grayScale);

      fourierTransform
        .highFrequencyAmplifier(innerRadius, radiusSize, filterStrength, grayScale)
        .drawSpectrum(true, canvasSpectrumTransformed, grayScale);

      fourierTransform
        .swap(grayScale)
        .fft(true, grayScale)
        .drawImage(canvasSpectrumReconstructed, grayScale);
  }
});
