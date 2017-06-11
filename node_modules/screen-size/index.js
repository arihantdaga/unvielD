'use strict'

var window = require('global/window')
var screen = window.screen || {}

module.exports = function screenSize () {
  return {
    x: screen.width,
    y: screen.height
  }
}
