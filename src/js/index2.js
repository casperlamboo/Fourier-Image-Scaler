import fields from 'img/fields.jpg';
import { loadImage, resizeImage } from 'js/imageUtils.js';
import FourierTransform from 'js/FourierTransform.js';

loadImage(fields).then(image => {
  const slider = document.createElement('input');
  slider.setAttribute('type', 'range');
  slider.setAttribute('min', '0');
  slider.setAttribute('max', '1');
  slider.setAttribute('value', '1');
  slider.setAttribute('step', '0.1');
  document.getElementById('app').appendChild(slider);

  const [
    canvasOriginal,
    canvasSpectrumOriginal,
    canvasResize,
    canvasSpectrumResize
  ] = Array.from(Array(4)).map(() => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    document.getElementById('app').appendChild(canvas);
    const context = canvas.getContext('2d');

    return canvas;
  });

  canvasOriginal.getContext('2d').drawImage(image, 0, 0);
  canvasResize.getContext('2d').drawImage(image, 0, 0);

  const fourierTransform = new FourierTransform();
  fourierTransform
    .init(canvasOriginal)
    .fft2d(false)
    .swap()
    // .swap()
    // .fft2d(true);
  fourierTransform.drawSpectrum(true, canvasSpectrumOriginal);
  fourierTransform.drawSpectrum(true, canvasSpectrumResize);

  slider.addEventListener('input', event => {
    const value = parseFloat(event.target.value);
    const sx = Math.max(1, Math.round(image.width * value));
    const sy = Math.max(1, Math.round(image.height * value));
    const resizedImage = resizeImage(resizeImage(image, sx, sy), image.width, image.height);
    canvasResize.getContext('2d').drawImage(resizedImage, 0, 0);

    fourierTransform
      .init(resizedImage)
      .fft2d(false)
      .swap()
      // .lowPassFilter(100)
      // .highPassFilter(100)
      // .bandPassFilter(100, 10)
      // .swap()
      // .fft2d(true)
      .drawSpectrum(true, canvasSpectrumResize)
      // .drawImage(canvasSpectrumResize);
  });
});
