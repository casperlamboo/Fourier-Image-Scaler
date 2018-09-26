const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: path.resolve(__dirname, 'src/js/index.js'),
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['es2015', 'react'],
          plugins: [
            require('babel-plugin-transform-object-rest-spread'), // transpile spread operator for objects
            require('babel-plugin-transform-class-properties'), // transpile class properties
            require('babel-plugin-transform-es2015-classes'), // react-hot-loader always needs this, see: https://github.com/gaearon/react-hot-loader/issues/313
            ...(devMode ? [
              require('react-hot-loader/babel')
            ] : [])
          ]
        }
      }, {
        test: /\.(glsl|md)$/,
        use: 'raw-loader'
      }, {
        test: /\.(png|jpg|gif)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]'
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      'js': path.resolve(__dirname, 'src/js'),
      'img': path.resolve(__dirname, 'src/img'),
      'glsl': path.resolve(__dirname, 'src/glsl'),
      'md': path.resolve(__dirname, 'src/md')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Fourier Transform Image Resizer',
      template: require('html-webpack-template'),
      inject: false,
      appMountId: 'app'
    })
  ],
  devtool: devMode ? 'eval-source-map' : 'nosources-source-map'
};
