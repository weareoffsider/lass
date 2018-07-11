const Lass = require('../index')

test('Multi line properties and variables', () => {
expect(Lass(
`
.component
  width 300px

  @media (min-width: 768px)
    width 600px
    @media (min-resolution: 192dpi)
      background-image url(/img/retina2x.png)

  @media (min-width: 1280px)
    width 800px
`
)).toBe(
`
.component {
  width: 300px;

  @media (min-width: 768px) {
    width: 600px;
    @media (min-resolution: 192dpi) {
      background-image: url(/img/retina2x.png);}}

  @media (min-width: 1280px) {
    width: 800px;}}
`
)})
