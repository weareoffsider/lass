const Lass = require('../index')

test('Multi line properties and variables', () => {
expect(Lass(
`
// Inclusive of the value and above.
.from(@unitlessPx, @rules)
  @ems unit( (@unitlessPx / 16), em)
  @media screen and (min-width: @ems)
    @rules()

.el
  +from(768)
    color red

+from(768)
  // h1,
  h2
    font-size 120%

  body
    font-size 18px
`
)).toBe(
`

.from(@unitlessPx, @rules) {
  @ems: unit( (@unitlessPx / 16), em);
  @media screen and (min-width: @ems) {
    @rules();}}

.el {
  .from(768, {
    color: red;});}

.from(768, {

  h2 {
    font-size: 120%;}

  body {
    font-size: 18px;}});
`
)})
