var webpack = require('webpack')
var merge = require('webpack-merge')
var base = require('./webpack.config.base')
var path = require('path')

var consts  = require('./webpack.config.constants')
var outputFile = consts.outputFile
var globalName = consts.globalName

module.exports = merge(base, {
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: outputFile + '.browser.min.js',
    library: globalName,
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: true,
      },
      mangle: false,
    }),
  ],
})
