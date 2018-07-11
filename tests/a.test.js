const Lass = require('../index')

test('Lots, while refactoring parser', () => {
  expect(Lass(
`.class
  &__something
    &::hover
      color red

@import "something"
@import (importRule) "something"

// Comment
@link-color #428bca // a nice purple
@link-color red // or a red // if purp not your thang
@my-selector link

.classname
  property value
  font-size 8, 2, 4
  // ^ this ain't valid

  &__el
    content "element"
    &::hover
      text-decoration underline
    color red

h1
  font-weight bold

h1, h2
  font-size big

h1,
h2
  font-size big

[disabled]
  opacity 0.5

// Usage
.@{my-selector}
  font-weight bold
  color @link-color
  line-height 40px

#id
  for you and me // for: you and me <-- like that

  &::after
    content ''


// Problem A.1
.test()
  abc 123

.mixin(@color; @margin: 2)
  color-3 @color
  margin @margin

.some .selector div
  .mixin(#008000)

  // Problem A.2 / .from(768)
  +from(768)
    color red

    &:hover
      color blue

  // ^ .from(768, { color: red }) note end '})'

.from(@px, @rules)
  @media screen and (min-width: @px)
    @rules()
`
)).toBe(
`.class {
  &__something {
    &::hover {
      color: red;}}}

@import "something";
@import (importRule) "something";


@link-color: #428bca;
@link-color: red;
@my-selector: link;

.classname {
  property: value;
  font-size: 8, 2, 4;


  &__el {
    content: "element";
    &::hover {
      text-decoration: underline;}
    color: red;}}

h1 {
  font-weight: bold;}

h1, h2 {
  font-size: big;}

h1,
h2 {
  font-size: big;}

[disabled] {
  opacity: 0.5;}


.@{my-selector} {
  font-weight: bold;
  color: @link-color;
  line-height: 40px;}

#id {
  for: you and me;

  &::after {
    content: '';}}



.test() {
  abc: 123;}

.mixin(@color; @margin: 2) {
  color-3: @color;
  margin: @margin;}

.some .selector div {
  .mixin(#008000);

  // Problem A.2 / .from(768)
  .from(768, {
    color: red;

    &:hover {
      color: blue; }});}



.from(@px, @rules) {
  @media screen and (min-width: @px) {
    @rules();}}
`
);
});
