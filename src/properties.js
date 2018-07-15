const allCssProperties = require('known-css-properties').all

module.exports = {
  all: allCssProperties,
  commaSeparated: [
    'animation',
    'animation-delay',
    'animation-direction',
    'animation-duration',
    'animation-iteration-count',
    'animation-name',
    'animation-play-state',
    'animation-timing-function',
    // 'background',
    // 'background-color',
    'background-image',
    // 'background-repeat',
    'background-attachment',
    // 'background-position',
    // 'background-clip',
    // 'background-origin',
    'background-size',
    'transition',
    'transition-delay',
    'transition-duration',
    'transition-property',
    'transition-timing-function',
    'cursor',
    'font',
    'font-family',
    'voice-family',
  ]
}
