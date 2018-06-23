const Lass = require('../index')

test('less-plugins-lists and pseudo-objects', () => {expect(Lass(
`
@Typography
  body
    font-size 22px
    font-weight normal
    line-height 1.3
  h2
    font-size 36px
    font-weight bold
    line-height 1.2
  small
    font-size 14px
    font-weight normal
    line-height 1.3

#Typography()
  .body()
    font-size @Typography.body.font-size
    font-weight @Typography.body.font-weight
    // line-height @Typography.body.line-height
    line-height (@Typography.body.font-size * @Typography.body.line-height)

  .h2()
    font-size @Typography.h2.font-size
    font-weight @Typography.h2.font-weight
    line-height @Typography.h2.line-height

  .small()
    @small @Typography.small
    .for-each(@pair in @small)
      // .for-each(@pair in @l: l(at(@Typography, small))) { // <-- single line version
      @prop at(@pair, 1)
      @val at(@pair, 2)
      @{prop} @val
`
)).toBe(
`
@Typography: l(
  body l(
    font-size 22px,
    font-weight normal,
    line-height 1.3 ),
  h2 l(
    font-size 36px,
    font-weight bold,
    line-height 1.2 ),
  small l(
    font-size 14px,
    font-weight normal,
    line-height 1.3 ));

#Typography() {
  .body() {
    font-size: at(at(@Typography, body), font-size);
    font-weight: at(at(@Typography, body), font-weight);
    // line-height @Typography.body.line-height
    line-height: (at(at(@Typography, body), font-size) * at(at(@Typography, body), line-height)); }

  .h2() {
    font-size: at(at(@Typography, h2), font-size);
    font-weight: at(at(@Typography, h2), font-weight);
    line-height: at(at(@Typography, h2), line-height); }

  .small() {
    @small: at(@Typography, small);
    .for-each(@pair in @small) {
      // .for-each(@pair in @l: l(at(@Typography, small))) { // <-- single line version
      @prop: at(@pair, 1);
      @val: at(@pair, 2);
      @{prop}: @val; }}}
`
)});
