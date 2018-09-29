export default class FourierTransform {
  _bitReversalTable = null;
  _sinCosTable = null;
  _size = 0;
  _real = [];
  _imag = [];

  init(image) {
    // throw error if size is not power of 2 or sqaure
    if (image.width !== 0 && (image.width & (image.width - 1)) !== 0) {
      throw new Error('image size should be a power of 2');
    }
    if (image.width !== image.height) {
      throw new Error('image should be square');
    }

    if (this._size !== image.width) {
      this._size = image.width;

      this._makeBitReversalTable();
      this._makeCosSinTable();
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = this._size;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, this._size, this._size);

    this._real = [];
    this._imag = [];
    for (let y = 0; y < this._size; y ++) {
      for (let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;

        const r = imageData.data[i * 4];
        const g = imageData.data[i * 4 + 1];
        const b = imageData.data[i * 4 + 2];
        const a = imageData.data[i * 4 + 3];
        const luma = (r * 0.2126 + g * 0.7152 + b * 0.0722) / (a / 255);

        this._real[i] = luma;
        this._imag[i] = 0.0;
      }
    }

    return this;
  }

  _fft1d(real, imag, inverse) {
    this._fft(real, imag, inverse ? -1 : 1);

    if (inverse) {
      const iSize = 1 / this._size;
      for (let i = 0; i < this._size; i ++) {
        real[i] *= iSize;
        imag[i] *= iSize;
      }
    }
  }

  fft2d(inverse) {
    const tempReal = [];
    const tempImag = [];
    // x-axis
    for (let y = 0; y < this._size; y ++) {
      for (let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;
        tempReal[x] = this._real[i];
        tempImag[x] = this._imag[i];
      }
      this._fft1d(tempReal, tempImag, inverse);
      for (let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;
        this._real[i] = tempReal[x];
        this._imag[i] = tempImag[x];
      }
    }
    // y-axis
    for (let x = 0; x < this._size; x ++) {
      for (let y = 0; y < this._size; y ++) {
        const i = y * this._size + x;
        tempReal[y] = this._real[i];
        tempImag[y] = this._imag[i];
      }
      this._fft1d(tempReal, tempImag, inverse);
      for (let y = 0; y < this._size; y ++) {
        const i = y * this._size + x;
        this._real[i] = tempReal[y];
        this._imag[i] = tempImag[y];
      }
    }

    return this;
  }

  drawSpectrum(isLog = true, canvas = document.createElement('canvas')) {
    canvas.width = canvas.height = this._size;
    const context = canvas.getContext('2d');
    const imageData = context.createImageData(this._size, this._size);

    const spectrum = [];

    let max = 1.0;
    for (let i = 0; i < this._size ** 2; i ++) {
      let magnitude = Math.sqrt(this._real[i] ** 2 + this._imag[i] ** 2);
      if (isLog) magnitude = Math.log(magnitude);

      spectrum[i] = magnitude;
      if (magnitude > max) max = magnitude;
    }

    for (let i = 0; i < this._size ** 2; i ++) {
      spectrum[i] = spectrum[i] * 255 / max;
    }

    for (let y = 0; y < this._size; y ++) {
      for (let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;
        const value = spectrum[i];

        imageData.data[i * 4] = 0;
        imageData.data[i * 4 + 1] = value;
        imageData.data[i * 4 + 2] = value >> 1;
        imageData.data[i * 4 + 3] = 255;
      }
    }
    context.putImageData(imageData, 0, 0);

    return canvas;
  }

  drawImage(canvas = document.createElement('canvas')) {
    canvas.width = canvas.height = this._size;
    const context = canvas.getContext('2d');

    const imageData = context.createImageData(this._size, this._size);
    for (let y = 0; y < this._size; y ++) {
      for(let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;
        const value = this._real[i];

        imageData.data[i * 4] = value;
        imageData.data[i * 4 + 1] = value;
        imageData.data[i * 4 + 2] = value;
        imageData.data[i * 4 + 3] = 255;
      }
    }
    context.putImageData(imageData, 0, 0);

    return canvas;
  }

  _makeBitReversalTable() {
    if (typeof Uint8Array !== 'undefined') {
      if (this._size <= 256) {
        this._bitReversalTable = new Uint8Array(this._size);
      } else if (this._size <= 65536) {
        this._bitReversalTable = new Uint16Array(this._size);
      } else {
        this._bitReversalTable = new Uint32Array(this._size);
      }
    } else {
      this._bitReversalTable = [];
    }

    let j = 0;
    this._bitReversalTable[0] = 0;
    for (let i = 1; i < this._size; i ++) {
      let k = this._size >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;

      this._bitReversalTable[i] = j;
    }
  }

  _makeCosSinTable() {
    if (typeof Float64Array !== 'undefined') {
      this._sinCosTable = new Float64Array(this._size * 1.25);
    } else {
      this._sinCosTable = [];
    }

    const n2 = this._size >> 1;
    const n4 = this._size >> 2;
    const n8 = this._size >> 3;
    const n2p4 = n2 + n4;
    let dc = 2 * Math.sin(Math.PI / this._size) ** 2;
    let ds = Math.sqrt(dc*(2 - dc));
    let c = this._sinCosTable[n4] = 1;
    let s = this._sinCosTable[0] = 0;
    const t = 2 * dc;

    for (let i = 1; i < n8; i ++) {
      c -= dc;
      dc += t * c;
      s += ds;
      ds -= t * s;
      this._sinCosTable[i] = s;
      this._sinCosTable[n4 - i] = c;
    }

    if (n8 !== 0) {
      this._sinCosTable[n8] = Math.sqrt(0.5);
    }
    for (let i = 0; i < n4; i ++) {
      this._sinCosTable[n2 - i]  = this._sinCosTable[i];
    }
    for (let i = 0; i < n2p4; i ++) {
      this._sinCosTable[i + n2] = -this._sinCosTable[i];
    }
  }

  _fft(real, imag, inverse) {
    // bit reversal
    for (let i = 0; i < this._size; i ++) {
      const reverseI = this._bitReversalTable[i];
      if (i < reverseI) {
        [real[i], real[reverseI]] = [real[reverseI], real[i]];
        [imag[i], imag[reverseI]] = [imag[reverseI], imag[i]];
      }
    }

    // butterfly operation
    const n4 = this._size >> 2;
    for (let i = 1; i < this._size; i <<= 1) {
      let h = 0;
      const d = this._size / (i << 1);
      for (let j = 0; j < i; j ++) {
        const wr = this._sinCosTable[h + n4];
        const wi = inverse * this._sinCosTable[h];
        for (let k = j; k < this._size; k += (i << 1)) {
          const ik = k + i;
          const xr = wr * real[ik] + wi * imag[ik];
          const xi = wr * imag[ik] - wi * real[ik];
          real[ik] = real[k] - xr;
          real[k] += xr;
          imag[ik] = imag[k] - xi;
          imag[k] += xi;
        }
        h += d;
      }
    }
  }

  swap() {
    const length = this._size >> 1;
    for (let y = 0; y < length; y++) {
      const yn = y + length;
      for (let x = 0; x < length; x ++) {
        const xn = x + length;

        const i = x + y * this._size;
        const j = xn + yn * this._size;
        const k = x + yn * this._size;
        const l = xn + y * this._size;

        [this._real[i], this._real[j]] = [this._real[j], this._real[i]];
        [this._real[k], this._real[l]] = [this._real[l], this._real[k]];
        [this._imag[i], this._imag[j]] = [this._imag[j], this._imag[i]];
        [this._imag[k], this._imag[l]] = [this._imag[l], this._imag[k]];
      }
    }

    return this;
  }

  highPassFilter(radius) {
    const n2 = this._size >> 1;
    for (let y =- n2; y < n2; y ++) {
      for (let x =- n2; x < n2; x ++) {
        const r = Math.sqrt(x ** 2 + y ** 2);
        if (r < radius) {
          const i = n2 + (y + n2) * this._size + x;
          this._real[i] = this._imag[i] = 0;
        }
      }
    }

    return this;
  }

  lowPassFilter(radius) {
    const n2 = this._size >> 1;
    for (let y =- n2; y < n2; y ++) {
      for (let x =- n2; x < n2; x ++) {
        const r = Math.sqrt(x ** 2 + y ** 2);
        if (r > radius) {
          const i = n2 + (y + n2) * this._size + x;
          this._real[i] = this._imag[i] = 0;
        }
      }
    }

    return this;
  }

  bandPassFilter(radius, bandwidth) {
    const n2 = this._size >> 1;
    for (let y =- n2; y < n2; y ++) {
      for (let x =- n2; x < n2; x ++) {
        const r = Math.sqrt(x ** 2 + y ** 2);
        if (r < radius || r > (radius + bandwidth)) {
          const i = n2 + (y + n2) * this._size + x;
          this._real[i] = this._imag[i] = 0;
        }
      }
    }

    return this;
  }
}
