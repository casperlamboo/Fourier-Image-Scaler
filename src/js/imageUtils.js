import ImageJS from 'imagejs';

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

export function resizeImage(imageData, width, height, algorithm) {
  const bitmap = new ImageJS.Bitmap(imageData).resize({ width, height, algorithm });

  const result = context.createImageData(width, height);
  for (let x = 0; x < width; x ++) {
    for (let y = 0; y < height; y ++) {
      const color = bitmap.getPixel(x, y);
      const i = y * width + x;

      result.data[i * 4] = color.r;
      result.data[i * 4 + 1] = color.g;
      result.data[i * 4 + 2] = color.b;
      result.data[i * 4 + 3] = color.a;
    }
  }

  return result;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
