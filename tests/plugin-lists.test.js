const Lass = require('../index')

test('less-plugins-lists and multi-line expressions', () => {expect(Lass(
`
@plugin "./node_modules/less-plugin-lists/lib/index.js"

@palette[,]
  primary #0000E0
  info #02d7e1
  success #02e10c

h1
  color at(@palette, primary)
  background-color at(@palette, info)
  border-color at(@palette, success)

@sizes[,] // with comments
  small 10px
  medium 20px
  large 30px
`
)).toBe(
`
@plugin "./node_modules/less-plugin-lists/lib/index.js";

@palette:
  primary #0000E0,
  info #02d7e1,
  success #02e10c;

h1 {
  color: at(@palette, primary);
  background-color: at(@palette, info);
  border-color: at(@palette, success); }

@sizes: // with comments
  small 10px,
  medium 20px,
  large 30px;
`
)});
