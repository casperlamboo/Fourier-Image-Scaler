import FULLSCREEN_VERTEX_SOURCE from 'glsl/fullscreenVertexSource.glsl';
import SUBTRANSFORM_FRAGMENT_SOURCE from 'glsl/subtransformFragmentSource.glsl';
import FILTER_FRAGMENT_SOURCE from 'glsl/filterFragmentSource.glsl';
import POWER_FRAGMENT_SOURCE from 'glsl/powerFragmentSource.glsl';
import IMAGE_FRAGMENT_SOURCE from 'glsl/imageFragmentSource.glsl'

const END_EDIT_FREQUENCY = 150.0;
const FORWARD = 1;
const INVERSE = 0;
const PING_TEXTURE_UNIT = 0;
const PONG_TEXTURE_UNIT = 1;
const FILTER_TEXTURE_UNIT = 2;
const ORIGINAL_SPECTRUM_TEXTURE_UNIT = 3;
const FILTERED_SPECTRUM_TEXTURE_UNIT = 4;
const IMAGE_TEXTURE_UNIT = 5;
const FILTERED_IMAGE_TEXTURE_UNIT = 6;
const READOUT_TEXTURE_UNIT = 7;

function displayGl(gl) {
  const resolution = 512;
  const pixels = new Uint8Array(resolution * resolution * 4);
  gl.readPixels(0, 0, resolution, resolution, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = resolution;
  canvas.height = resolution;
  const context = canvas.getContext('2d');
  const imageData = context.getImageData(0, 0, resolution, resolution);
  imageData.data.set(pixels);
  for (let i = 0; i < pixels.length; i ++) {
    imageData.data[i] = pixels[i];
  }
  context.putImageData(imageData, 0, 0);
}

function buildShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function buildProgramWrapper(gl, vertexShader, fragmentShader, attributeLocations) {
  const programWrapper = {};

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  for (let attributeName in attributeLocations) {
    gl.bindAttribLocation(program, attributeLocations[attributeName], attributeName);
  }
  gl.linkProgram(program);
  const uniformLocations = {};
  const numberOfUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < numberOfUniforms; i += 1) {
    const activeUniform = gl.getActiveUniform(program, i);
    const uniformLocation = gl.getUniformLocation(program, activeUniform.name);
    uniformLocations[activeUniform.name] = uniformLocation;
  }

  programWrapper.program = program;
  programWrapper.uniformLocations = uniformLocations;

  return programWrapper;
}

function buildTexture(gl, unit, format, type, width, height, data, wrapS, wrapT, minFilter, magFilter) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
  return texture;
}

function buildFramebuffer(gl, attachment) {
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, attachment, 0);
  return framebuffer;
}

function isPowerOf2(n) {
  return n && (n & (n - 1)) === 0;
}
function log2(x) {
  return Math.log(x) / Math.log(2);
}

export function filter(image, filterArray) {
  if (!(image.width === image.height && isPowerOf2(image.width))) {
    throw new Error('image should be square and sides should be a power of 2');
  }

  const resolution = image.width;

  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  gl.getExtension('OES_texture_float');
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  displayGl(gl);

  const pingTexture = buildTexture(gl, PING_TEXTURE_UNIT, gl.RGBA, gl.FLOAT, resolution, resolution, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);
  const pingFramebuffer = buildFramebuffer(gl, pingTexture);

  const pongTexture = buildTexture(gl, PONG_TEXTURE_UNIT, gl.RGBA, gl.FLOAT, resolution, resolution, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);
  const pongFramebuffer = buildFramebuffer(gl, pongTexture);

  const filterTexture = buildTexture(gl, FILTER_TEXTURE_UNIT, gl.RGBA, gl.FLOAT, resolution, 1, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);

  const originalSpectrumTexture = buildTexture(gl, ORIGINAL_SPECTRUM_TEXTURE_UNIT, gl.RGBA, gl.FLOAT, resolution, resolution, null, gl.REPEAT, gl.REPEAT, gl.NEAREST, gl.NEAREST);
  const originalSpectrumFramebuffer = buildFramebuffer(gl, originalSpectrumTexture);

  const filteredSpectrumTexture = buildTexture(gl, FILTERED_SPECTRUM_TEXTURE_UNIT, gl.RGBA, gl.FLOAT, resolution, resolution, null, gl.REPEAT, gl.REPEAT, gl.NEAREST, gl.NEAREST);
  const filteredSpectrumFramebuffer = buildFramebuffer(gl, filteredSpectrumTexture);

  const filteredImageTexture = buildTexture(gl, FILTERED_IMAGE_TEXTURE_UNIT, gl.RGBA, gl.FLOAT, resolution, resolution, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);
  const filteredImageFramebuffer = buildFramebuffer(gl, filteredImageTexture);

  const readoutTexture = buildTexture(gl, READOUT_TEXTURE_UNIT, gl.RGBA, gl.UNSIGNED_BYTE, resolution, resolution, null, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, gl.NEAREST, gl.NEAREST);
  const readoutFramebuffer = buildFramebuffer(gl, readoutTexture);

  const fullscreenVertexShader = buildShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERTEX_SOURCE);

  const subtransformProgramWrapper = buildProgramWrapper(gl, fullscreenVertexShader, buildShader(gl, gl.FRAGMENT_SHADER, SUBTRANSFORM_FRAGMENT_SOURCE), { 'a_position': 0 });
  gl.useProgram(subtransformProgramWrapper.program);
  gl.uniform1f(subtransformProgramWrapper.uniformLocations['u_resolution'], resolution);

  const readoutProgram = buildProgramWrapper(gl, fullscreenVertexShader, buildShader(gl, gl.FRAGMENT_SHADER, POWER_FRAGMENT_SOURCE), { 'a_position': 0 });
  gl.useProgram(readoutProgram.program);
  gl.uniform1i(readoutProgram.uniformLocations['u_spectrum'], ORIGINAL_SPECTRUM_TEXTURE_UNIT);
  gl.uniform1f(readoutProgram.uniformLocations['u_resolution'], resolution);

  const imageProgram = buildProgramWrapper(gl, fullscreenVertexShader, buildShader(gl, gl.FRAGMENT_SHADER, IMAGE_FRAGMENT_SOURCE), { 'a_position': 0 });
  gl.useProgram(imageProgram.program);
  gl.uniform1i(imageProgram.uniformLocations['u_texture'], FILTERED_IMAGE_TEXTURE_UNIT);

  const filterProgram = buildProgramWrapper(gl, fullscreenVertexShader, buildShader(gl, gl.FRAGMENT_SHADER, FILTER_FRAGMENT_SOURCE), { 'a_position': 0 });
  gl.useProgram(filterProgram.program);
  gl.uniform1i(filterProgram.uniformLocations['u_input'], ORIGINAL_SPECTRUM_TEXTURE_UNIT);
  gl.uniform1i(filterProgram.uniformLocations['u_filter'], FILTER_TEXTURE_UNIT);
  gl.uniform1f(filterProgram.uniformLocations['u_resolution'], resolution);
  gl.uniform1f(filterProgram.uniformLocations['u_maxEditFrequency'], END_EDIT_FREQUENCY);

  const fullscreenVertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenVertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  const iterations = log2(resolution) * 2;

  function fft(inputTextureUnit, outputFramebuffer, width, height, direction) {
    gl.useProgram(subtransformProgramWrapper.program);
    gl.viewport(0, 0, resolution, resolution);
    gl.uniform1i(subtransformProgramWrapper.uniformLocations['u_horizontal'], 1);
    gl.uniform1i(subtransformProgramWrapper.uniformLocations['u_forward'], direction);
    for (let i = 0; i < iterations; i += 1) {
      if (i === 0) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, pingFramebuffer);
        gl.uniform1i(subtransformProgramWrapper.uniformLocations['u_input'], inputTextureUnit);
      } else if (i === iterations - 1) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
        gl.uniform1i(subtransformProgramWrapper.uniformLocations['u_input'], PING_TEXTURE_UNIT);
      } else if (i % 2 === 1) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, pongFramebuffer);
        gl.uniform1i(subtransformProgramWrapper.uniformLocations['u_input'], PING_TEXTURE_UNIT);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, pingFramebuffer);
        gl.uniform1i(subtransformProgramWrapper.uniformLocations['u_input'], PONG_TEXTURE_UNIT);
      }

      if (direction === INVERSE && i === 0) {
        gl.uniform1i(subtransformProgramWrapper.uniformLocations['u_normalize'], 1);
      } else if (direction === INVERSE && i === 1) {
        gl.uniform1i(subtransformProgramWrapper.uniformLocations['u_normalize'], 0);
      }

      if (i === iterations / 2) {
        gl.uniform1i(subtransformProgramWrapper.uniformLocations['u_horizontal'], 0);
      }

      gl.uniform1f(subtransformProgramWrapper.uniformLocations['u_subtransformSize'], Math.pow(2, (i % (iterations / 2)) + 1));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  };
  gl.activeTexture(gl.TEXTURE0 + IMAGE_TEXTURE_UNIT);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.activeTexture(gl.TEXTURE0 + ORIGINAL_SPECTRUM_TEXTURE_UNIT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, resolution, resolution, 0, gl.RGBA, gl.FLOAT, null);

  fft(IMAGE_TEXTURE_UNIT, originalSpectrumFramebuffer, resolution, resolution, FORWARD);

  // // create powers by frequency
  // gl.viewport(0, 0, resolution, resolution);
  //
  // gl.bindFramebuffer(gl.FRAMEBUFFER, readoutFramebuffer);
  // gl.useProgram(readoutProgram.program);
  // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  //
  //
  // const powersByFrequency = {};
  //
  // let pixelIndex = 0;
  // for (let pixelX = 0; pixelX < resolution; pixelX ++) {
  //   for (let pixelY = 0; pixelY < resolution; pixelY ++) {
  //     const x = pixelY - resolution / 2;
  //     const y = pixelX - resolution / 2;
  //
  //     const r = pixels[pixelIndex] / 255;
  //     const g = pixels[pixelIndex + 1] / 255;
  //     const b = pixels[pixelIndex + 2] / 255;
  //     const a = pixels[pixelIndex + 3] / 255;
  //
  //     const average = r + g / 255 + b / 65025 + a / 160581375; //unpack float from rgb
  //
  //     const frequency = Math.sqrt(x ** 2 + y ** 2);
  //
  //     if (!powersByFrequency[frequency]) powersByFrequency[frequency] = [];
  //     powersByFrequency[frequency].push(average);
  //
  //     pixelIndex += 4;
  //   }
  // }

  gl.activeTexture(gl.TEXTURE0 + FILTER_TEXTURE_UNIT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, filterArray.length, 1, 0, gl.ALPHA, gl.FLOAT, filterArray);

  gl.useProgram(filterProgram.program);

  gl.bindFramebuffer(gl.FRAMEBUFFER, filteredSpectrumFramebuffer);
  gl.viewport(0, 0, resolution, resolution);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  fft(FILTERED_SPECTRUM_TEXTURE_UNIT, filteredImageFramebuffer, resolution, resolution, INVERSE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.viewport(0, 0, resolution, resolution);
  gl.useProgram(imageProgram.program);
  gl.uniform1f(imageProgram.uniformLocations['u_resolution'], resolution);
  gl.uniform1i(imageProgram.uniformLocations['u_texture'], FILTERED_IMAGE_TEXTURE_UNIT);
  gl.uniform1i(imageProgram.uniformLocations['u_spectrum'], FILTERED_SPECTRUM_TEXTURE_UNIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  return canvas;
}

export function hasWebGLSupportWithExtensions(extensions) {
  const canvas = document.createElement('canvas');

  let gl;
  try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  } catch (error) {
    return false;
  }

  if (!gl) return false;

  for (let i = 0; i < extensions.length; i ++) {
    if (!gl.getExtension(extensions[i])) return false
  }

  return true;
}
