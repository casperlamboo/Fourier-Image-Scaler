import imageSrc from 'img/256.png';
import { loadImage, resizeImage } from 'js/imageUtils.js';
import FourierTransform from 'js/FourierTransform.js';

const DOM = `
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

document.body.innerHTML = DOM;

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

function appendWithLabel(id, dom, label) {
  const child = document.createElement('div');
  child.style.marginRight = "5px"

  const p = document.createElement('p');
  p.innerHTML = label;

  child.appendChild(p);
  child.appendChild(dom);

  document.getElementById(id).appendChild(child);
}

loadImage(imageSrc).then(image => {
  let resize = 1;
  let innerRadius = 100;
  let radiusSize = 100;
  let filterStrength = 1.5;

  const sliderResize = createSlider(0, 1, resize);
  appendWithLabel('sliders', sliderResize, 'resize');
  const sliderInnerRadius = createSlider(0, 300, innerRadius);
  appendWithLabel('sliders', sliderInnerRadius, 'filter inner radius');
  const sliderRadiusSize = createSlider(0, 100, radiusSize);
  appendWithLabel('sliders', sliderRadiusSize, 'filter radius size');
  const sliderFilterStrength = createSlider(0, 100, filterStrength);
  appendWithLabel('sliders', sliderFilterStrength, 'filter strength');

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
    .fft2d(false)
    .swap();

  fourierTransform.drawSpectrum(true, canvasSpectrumOriginal);
  fourierTransform.drawSpectrum(true, canvasSpectrumResize);
  fourierTransform.drawSpectrum(true, canvasSpectrumTransformed);
  fourierTransform
    .swap()
    .fft2d(true)
    .drawImage(canvasSpectrumReconstructed);

  redraw();

  sliderResize.addEventListener('input', event => {
    resize = parseFloat(event.target.value);
    redraw();
  });

  sliderInnerRadius.addEventListener('input', event => {
    innerRadius = parseFloat(event.target.value);
    redraw();
  });

  sliderRadiusSize.addEventListener('input', event => {
    radiusSize = parseFloat(event.target.value);
    redraw();
  });

  sliderFilterStrength.addEventListener('input', event => {
    filterStrength = parseFloat(event.target.value);
    redraw();
  });

  function redraw() {
    const sx = Math.max(1, Math.round(image.width * resize));
    const sy = Math.max(1, Math.round(image.height * resize));
    const resizedImage = resizeImage(resizeImage(image, sx, sy), image.width, image.height);
    canvasResize.getContext('2d').drawImage(resizedImage, 0, 0);

    fourierTransform
      .init(resizedImage)
      .fft2d(false)
      .swap()
      .drawSpectrum(true, canvasSpectrumResize);

      fourierTransform
        .highFrequencyAmplifier(innerRadius, radiusSize, filterStrength)
        .drawSpectrum(true, canvasSpectrumTransformed);

      fourierTransform
        .swap()
        .fft2d(true)
        .drawImage(canvasSpectrumReconstructed);
  }
});
