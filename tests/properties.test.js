const Lass = require('../index'); test('Lots, while refactoring parser', () => {expect(Lass(`
.class
  &__something
    color red
    transition
      opacity 0.3s
      transform 0.3s
      color 0.3s

  h1,
  .class,
  &__sub
    &::active,
    &::focus,
    &::hover
      color red
      background
        url()
        no-repeat

.classname
  property value
  font-size 8, 2, 4
  // ^ this ain't valid
  transition
    opacity 0.3s
    transform 0.3s
    color 0.3s

  // @{myProperty} // not supported
  //   scale(3)
  //   rotate(120deg)
`
)).toBe(`
.class {
  &__something {
    color: red;
    transition:
      opacity 0.3s,
      transform 0.3s,
      color 0.3s;}

  h1,
  .class,
  &__sub {
    &::active,
    &::focus,
    &::hover {
      color: red;
      background:
        url(),
        no-repeat;}}}

.classname {
  property: value;
  font-size: 8, 2, 4;

  transition:
    opacity 0.3s,
    transform 0.3s,
    color 0.3s;}
`
);
});
