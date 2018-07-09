const Lass = require('../index'); test('less-plugins-lists and pseudo-objects', () => {expect(Lass(`
@Typography                 // OBJECT_DEFINITION
  body                      // OBJECT_PROPERTY
    font-size 22px          // OBJECT_VALUE
    font-weight normal
    line-height 1.3         // OBJECT_VALUE IS_LAST
  h2
    font-size 36px
    font-weight bold
`
)).toBe(
`
@Typography: l(
  body l(
    font-size 22px,
    font-weight normal,
    line-height 1.3),
  h2 l(
    font-size 36px,
    font-weight bold));
`
)});
