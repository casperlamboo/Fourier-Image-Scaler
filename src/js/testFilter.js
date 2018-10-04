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
`;;

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

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  return canvas;
}

function createCheckbox(checked) {
  const checkbox = document.createElement('input');
  checkbox.setAttribute('type', 'checkbox');
  checkbox.setAttribute('checked', checked);

  return checkbox;
}

function appendWithLabel(id, dom, label) {
function createButton(name) {
  const button = document.createElement('button');
  button.innerHTML = name;

  return button;
}
  const child = document.createElement('div');
  child.style.marginRight = "5px"

  const p = document.createElement('p');
  p.innerHTML = label;

  child.appendChild(p);
  child.appendChild(dom);

  document.getElementById(id).appendChild(child);
}

Promise.all(imageSrcs.map(loadImage)).then(images => {
  let [image] = images;
  let [{ algorithm }] = resizeAlgorithms;

  let resize = 1;
  let innerRadius = 100;
  let radiusSize = 100;
  let filterStrength = 1.5;
  let smooth = true;

  const previousButton = createButton('Previous Image');
  const nextButton = createButton('Next Image');
  appendWithLabel('sliders', [previousButton, nextButton], 'Image');
  const sliderResize = createSlider(0, 1, resize);
  appendWithLabel('sliders', sliderResize, 'resize');
  const sliderInnerRadius = createSlider(0, 300, innerRadius);
  appendWithLabel('sliders', sliderInnerRadius, 'filter inner radius');
  const sliderRadiusSize = createSlider(0, 100, radiusSize);
  appendWithLabel('sliders', sliderRadiusSize, 'filter radius size');
  const sliderFilterStrength = createSlider(0, 100, filterStrength);
  appendWithLabel('sliders', sliderFilterStrength, 'filter strength');
  const smoothCheckbox = createCheckbox(smooth);
  appendWithLabel('sliders', smoothCheckbox, 'smooth');

  const canvasOriginal = createCanvas(image.width, image.height);
  appendWithLabel('original', canvasOriginal, 'Original Image');
  const canvasSpectrumOriginal = createCanvas(image.width, image.height);
  appendWithLabel('original', canvasSpectrumOriginal, 'FFT of Original Image');

  const canvasResize = createCanvas(image.width, image.height);
  appendWithLabel('transform', canvasResize, 'Resized Image');
  const canvasSpectrumResize = createCanvas(image.width, image.height);
  appendWithLabel('transform', canvasSpectrumResize, 'FTT of Resized Image');
  const canvasSpectrumTransformed = createCanvas(image.width, image.height);
  appendWithLabel('transform', canvasSpectrumTransformed, 'Edited FFT');
  const canvasSpectrumReconstructed = createCanvas(image.width, image.height);
  appendWithLabel('transform', canvasSpectrumReconstructed, 'Reconstructed Image');

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

  redraw(false);

  nextButton.addEventListener('click', () => {
    image = images[(images.indexOf(image) + 1) % images.length];
    redraw(false);
  });

  previousButton.addEventListener('click', () => {
    image = images[(images.indexOf(image) - 1 + images.length) % images.length];
    redraw(false);
  });

  sliderResize.addEventListener('input', event => {
    resize = parseFloat(event.target.value);
    redraw(true);
  });
  sliderResize.addEventListener('change', event => {
    resize = parseFloat(event.target.value);
    redraw(false);
  });

  sliderInnerRadius.addEventListener('input', event => {
    innerRadius = parseFloat(event.target.value);
    redraw(true);
  });
  sliderInnerRadius.addEventListener('change', event => {
    innerRadius = parseFloat(event.target.value);
    redraw(false);
  });

  sliderRadiusSize.addEventListener('input', event => {
    radiusSize = parseFloat(event.target.value);
    redraw(true);
  });
  sliderRadiusSize.addEventListener('change', event => {
    radiusSize = parseFloat(event.target.value);
    redraw(false);
  });

  sliderFilterStrength.addEventListener('input', event => {
    filterStrength = parseFloat(event.target.value);
    redraw(true);
  });
  sliderFilterStrength.addEventListener('change', event => {
    filterStrength = parseFloat(event.target.value);
    redraw(false);
  });

  smoothCheckbox.addEventListener('change', event => {
    smooth = event.target.checked;
    redraw(false);
  });

  function redraw(grayScale) {
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
    const resizedImage = resizeImage(resizeImage(image, sx, sy, smooth), image.width, image.height, smooth);
    canvasResize.getContext('2d').drawImage(resizedImage, 0, 0);

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
