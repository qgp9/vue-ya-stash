var merge = require('webpack-merge')
var base = require('./webpack.config.base')
var consts  = require('./webpack.config.constants')
var path = require('path')

var outputFile = consts.outputFile
var globalName = consts.globalName

module.exports = merge(base, {
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: outputFile + '.common.js',
    library: globalName,
    libraryTarget: 'umd',
  },
  devtool: 'eval-source-map',
})
