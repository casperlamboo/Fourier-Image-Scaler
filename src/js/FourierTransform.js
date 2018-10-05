export default class FourierTransform {
  _bitReversalTable = null;
  _sinCosTable = null;
  _size = 0;
  _real = [[], [], []];
  _imag = [[], [], []];

  init(image, grayScale = false) {
    // throw error if size is not power of 2 or sqaure
    if (image.width !== 0 && (image.width & (image.width - 1)) !== 0) {
      throw new Error('image size should be a power of 2');
    }
    if (image.width !== image.height) {
      throw new Error('image should be square');
    }

    if (this._size !== image.width) {
      this._size = image.width;

      this._bitReversalTable = makeBitReversalTable(this._size);
      this._sinCosTable = makeSinCosTable(this._size);
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = this._size;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, this._size, this._size);

    this._real = [[], [], []];
    this._imag = [[], [], []];
    for (let y = 0; y < this._size; y ++) {
      for (let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;

        for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
          this._real[j][i] = imageData.data[i * 4 + j];
          this._imag[j][i] = 0.0;
        }
      }
    }

    return this;
  }

  fft(inverse = false, grayScale) {
    const tempReal = [[], [], []];
    const tempImag = [[], [], []];
    // x-axis
    for (let y = 0; y < this._size; y ++) {
      for (let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;
        for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
          tempReal[j][x] = this._real[j][i];
          tempImag[j][x] = this._imag[j][i];
        }
      }
      for (let i = 0; i < (grayScale ? 1 : 3); i ++) {
        fft(this._size, this._bitReversalTable, this._sinCosTable, tempReal[i], tempImag[i], inverse);
      }
      for (let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;
        for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
          this._real[j][i] = tempReal[j][x];
          this._imag[j][i] = tempImag[j][x];
        }
      }
    }
    // y-axis
    for (let x = 0; x < this._size; x ++) {
      for (let y = 0; y < this._size; y ++) {
        const i = y * this._size + x;
        for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
          tempReal[j][y] = this._real[j][i];
          tempImag[j][y] = this._imag[j][i];
        }
      }
      for (let i = 0; i < (grayScale ? 1 : 3); i ++) {
        fft(this._size, this._bitReversalTable, this._sinCosTable, tempReal[i], tempImag[i], inverse);
      }
      for (let y = 0; y < this._size; y ++) {
        const i = y * this._size + x;
        for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
          this._real[j][i] = tempReal[j][y];
          this._imag[j][i] = tempImag[j][y];
        }
      }
    }

    return this;
  }

  drawSpectrum(isLog = true, canvas = document.createElement('canvas'), grayScale = false) {
    canvas.width = canvas.height = this._size;
    const context = canvas.getContext('2d');
    const imageData = context.createImageData(this._size, this._size);
    for (let i = 0; i < this._size ** 2; i ++) {
      imageData.data[i * 4 + 3] = 255;
    }

    const spectrum = [[], [], []];

    let max = 1.0;
    for (let i = 0; i < this._size ** 2; i ++) {
      for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
        let magnitude = Math.sqrt(this._real[j][i] ** 2 + this._imag[j][i] ** 2);
        if (isLog) magnitude = Math.log(magnitude);

        spectrum[j][i] = magnitude;

        if (magnitude > max) max = magnitude
      }
    }

    for (let i = 0; i < this._size ** 2; i ++) {
      for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
        // spectrum[j][i] = spectrum[j][i] * 255 / max;
        spectrum[j][i] = spectrum[j][i] * 255 / 16;
      }
    }

    for (let y = 0; y < this._size; y ++) {
      for (let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;

        if (grayScale) {
          const magnitude = spectrum[0][i];
          imageData.data[i * 4] = magnitude;
          imageData.data[i * 4 + 1] = magnitude;
          imageData.data[i * 4 + 2] = magnitude;
        } else {
          for (let j = 0; j < 3; j ++) {
            const magnitude = spectrum[j][i]
            imageData.data[i * 4 + j] = magnitude;
          }
        }
      }
    }
    context.putImageData(imageData, 0, 0);

    return canvas;
  }

  drawImage(canvas = document.createElement('canvas'), grayScale = false) {
    canvas.width = canvas.height = this._size;
    const context = canvas.getContext('2d');
    const imageData = context.createImageData(this._size, this._size);
    for (let i = 0; i < this._size ** 2; i ++) {
      imageData.data[i * 4 + 3] = 255;
    }

    for (let y = 0; y < this._size; y ++) {
      for(let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;

        if (grayScale) {
          const magnitude = this._real[0][i];
          imageData.data[i * 4] = magnitude;
          imageData.data[i * 4 + 1] = magnitude;
          imageData.data[i * 4 + 2] = magnitude;
        } else {
          for (let j = 0; j < 3; j ++) {
            const magnitude = this._real[j][i];
            imageData.data[i * 4 + j] = magnitude;
          }
        }
      }
    }
    context.putImageData(imageData, 0, 0);

    return canvas;
  }

  swap(grayScale = false) {
    const length = this._size >> 1;
    for (let y = 0; y < length; y++) {
      const yn = y + length;
      for (let x = 0; x < length; x ++) {
        const xn = x + length;

        const i = x + y * this._size;
        const j = xn + yn * this._size;
        const k = x + yn * this._size;
        const l = xn + y * this._size;

        for (let m = 0; m < (grayScale ? 1 : 3); m ++) {
          [this._real[m][i], this._real[m][j]] = [this._real[m][j], this._real[m][i]];
          [this._real[m][k], this._real[m][l]] = [this._real[m][l], this._real[m][k]];
          [this._imag[m][i], this._imag[m][j]] = [this._imag[m][j], this._imag[m][i]];
          [this._imag[m][k], this._imag[m][l]] = [this._imag[m][l], this._imag[m][k]];
        }
      }
    }

    return this;
  }

  highPassFilter(radius, grayScale = false) {
    const n2 = this._size >> 1;
    for (let y =- n2; y < n2; y ++) {
      for (let x =- n2; x < n2; x ++) {
        const r = Math.sqrt(x ** 2 + y ** 2);
        if (r < radius) {
          const i = n2 + (y + n2) * this._size + x;
          for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
            this._real[j][i] = 0;
            this._imag[j][i] = 0;
          }
        }
      }
    }

    return this;
  }

  lowPassFilter(radius, grayScale = false) {
    const n2 = this._size >> 1;
    for (let y =- n2; y < n2; y ++) {
      for (let x =- n2; x < n2; x ++) {
        const r = Math.sqrt(x ** 2 + y ** 2);
        if (r > radius) {
          const i = n2 + (y + n2) * this._size + x;
          for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
            this._real[j][i] = 0;
            this._imag[j][i] = 0;
          }
        }
      }
    }

    return this;
  }

  bandPassFilter(radius, bandwidth, grayScale = false) {
    const n2 = this._size >> 1;
    for (let y =- n2; y < n2; y ++) {
      for (let x =- n2; x < n2; x ++) {
        const r = Math.sqrt(x ** 2 + y ** 2);
        if (r < radius || r > (radius + bandwidth)) {
          const i = n2 + (y + n2) * this._size + x;
          for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
            this._real[j][i] = 0;
            this._imag[j][i] = 0;
          }
        }
      }
    }

    return this;
  }

  highFrequencyAmplifier(radius, radiusSize, grayScale = false) {
    const n2 = this._size >> 1;
    for (let y =- n2; y < n2; y ++) {
      for (let x =- n2; x < n2; x ++) {
        const r = Math.sqrt(x ** 2 + y ** 2);

        let value;
        if (r < radius) {
          value = 0;
        } else if (r > radius + radiusSize) {
          value = 1;
        } else {
          value = cosLerp((r - radius) / radiusSize);
        }

        const i = n2 + (y + n2) * this._size + x;
        for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
          this._real[j][i] *= value;
          this._imag[j][i] *= value;
        }
      }
    }

    return this;
  }

  window(fallOfSize, grayScale = false) {
    for (let y = 0; y < this._size; y ++) {
      for (let x = 0; x < this._size; x ++) {
        const i = y * this._size + x;

        const l = x < fallOfSize;
        const r = x > (this._size - fallOfSize);
        const t = y < fallOfSize;
        const b = y > (this._size - fallOfSize);

        let value;
        if (l && t) {
          value = 1 - (Math.sqrt((fallOfSize - x) ** 2 + (fallOfSize - y) ** 2) / fallOfSize);
        } else if (t && r) {
          value = 1 - (Math.sqrt((this._size - fallOfSize - x) ** 2 + (fallOfSize - y) ** 2) / fallOfSize);
        } else if (b && r) {
          value = 1 - (Math.sqrt((this._size - fallOfSize - x) ** 2 + (this._size - fallOfSize - y) ** 2) / fallOfSize);
        } else if (b && l) {
          value = 1 - (Math.sqrt((fallOfSize - x) ** 2 + (this._size - fallOfSize - y) ** 2) / fallOfSize);
        } else if (t) {
          value = y / fallOfSize;
        } else if (r) {
          value = (this._size - x) / fallOfSize;
        } else if (b) {
          value = (this._size - y) / fallOfSize;
        } else if (l) {
          value = x / fallOfSize;
        } else {
          value = 1;
        }

        for (let j = 0; j < (grayScale ? 1 : 3); j ++) {
          this._real[j][i] *= cosLerp(value);
          this._imag[j][i] *= cosLerp(value);
        }
      }
    }
    return this;
  }
}

function makeBitReversalTable(size) {
  let bitReversalTable
  if (typeof Uint8Array !== 'undefined') {
    if (size <= 256) {
      bitReversalTable = new Uint8Array(size);
    } else if (size <= 65536) {
      bitReversalTable = new Uint16Array(size);
    } else {
      bitReversalTable = new Uint32Array(size);
    }
  } else {
    bitReversalTable = [];
  }

  let j = 0;
  bitReversalTable[0] = 0;
  for (let i = 1; i < size; i ++) {
    let k = size >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;

    bitReversalTable[i] = j;
  }

  return bitReversalTable;
}

function makeSinCosTable(size) {
  let sinCosTable;
  if (typeof Float64Array !== 'undefined') {
    sinCosTable = new Float64Array(size * 1.25);
  } else {
    sinCosTable = [];
  }

  const n2 = size >> 1;
  const n4 = size >> 2;
  const n8 = size >> 3;
  const n2p4 = n2 + n4;
  let dc = 2 * Math.sin(Math.PI / size) ** 2;
  let ds = Math.sqrt(dc*(2 - dc));
  let c = sinCosTable[n4] = 1;
  let s = sinCosTable[0] = 0;
  const t = 2 * dc;

  for (let i = 1; i < n8; i ++) {
    c -= dc;
    dc += t * c;
    s += ds;
    ds -= t * s;
    sinCosTable[i] = s;
    sinCosTable[n4 - i] = c;
  }

  if (n8 !== 0) {
    sinCosTable[n8] = Math.sqrt(0.5);
  }
  for (let i = 0; i < n4; i ++) {
    sinCosTable[n2 - i] = sinCosTable[i];
  }
  for (let i = 0; i < n2p4; i ++) {
    sinCosTable[i + n2] = -sinCosTable[i];
  }

  return sinCosTable;
}

function fft(size, bitReversalTable, sinCosTable, imag, real, inverse) {
  // bit reversal
  for (let i = 0; i < size; i ++) {
    const reverseI = bitReversalTable[i];
    if (i < reverseI) {
      [real[i], real[reverseI]] = [real[reverseI], real[i]];
      [imag[i], imag[reverseI]] = [imag[reverseI], imag[i]];
    }
  }

  // butterfly operation
  const n4 = size >> 2;
  for (let i = 1; i < size; i <<= 1) {
    let h = 0;
    const d = size / (i << 1);
    for (let j = 0; j < i; j ++) {
      const wr = sinCosTable[h + n4];
      const wi = inverse ? -sinCosTable[h] : sinCosTable[h];
      for (let k = j; k < size; k += (i << 1)) {
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

  if (inverse) {
    const iSize = 1 / size;
    for (let i = 0; i < size; i ++) {
      real[i] *= iSize;
      imag[i] *= iSize;
    }
  }
}

function cosLerp(x) {
  if (x < 0) {
    return 0;
  } else if (x > 1) {
    return 1;
  } else {
    // return x;
    return (-Math.cos(x * Math.PI) * 0.5) + 0.5;
  }
}
