const Lass = require('../index'); test('less-plugins-lists and pseudo-objects', () => {expect(Lass(`
@import "something"
@import (importRule) "something"
@plugin "./node_modules/less-plugin-lists/lib/index.js"

@Typography                 // OBJECT_DEFINITION
  body                      // OBJECT_PROPERTY
    font-size 22px          // OBJECT_VALUE
    font-weight normal
    line-height 1.3         // OBJECT_VALUE IS_LAST
  h2
    font-size 36px
    font-weight bold

// Class
.class
  &__something

    &::hover
      color red
      font-size blue
      transition color 0.3s, opacity 0.3s

// Component
.component
  width 300px
  height 100px

  @media (min-width: 768px)
    width 600px

    // Nested @media ftw
    @media (min-resolution: 192dpi)
      background-image url(/img/retina2x.png)

  @media (min-width: 1280px)
    width 800px
`
)).toBe(
`
@import "something";
@import (importRule) "something";
@plugin "./node_modules/less-plugin-lists/lib/index.js";

@Typography: l( // OBJECT_DEFINITION
  body l( // OBJECT_PROPERTY
    font-size 22px,
    font-weight normal,
    line-height 1.3),
  h2 l(
    font-size 36px,
    font-weight bold));

// Class
.class {
  &__something {
    &::hover {
      color: red;
      font-size: blue;
      transition: color 0.3s, opacity 0.3s;}}}

// Component
.component {
  width: 300px;
  height: 100px;
  @media (min-width: 768px) {
    width: 600px;

    // Nested @media ftw
    @media (min-resolution: 192dpi) {
      background-image: url(/img/retina2x.png);}}
  @media (min-width: 1280px) {
    width: 800px;}}
`
)});
