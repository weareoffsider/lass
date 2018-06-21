Lass
====

[Less](http://lesscss.org/), but indented, no colons, no brances.

```
@import (importRule) "something"

// Comment
@link-color #428bca // a nice colour!

.classname
  property value
  font-size 10px

  a
    color @link-color

    &::hover,
    &::active,
    &::focus
      text-decoration underline
```
...becomes:
```

```
@import (importRule) "something";

// Comment
@link-color: #428bca; // a nice colour!

.classname {
  property: value;
  font-size: 10px;

  a {
    color: @link-color;

    &::hover,
    &::active,
    &::focus {
      text-decoration: underline; }}}
```


Why?
----

I really, really like the features of Less — especially the error reporting and import-once behaviour — but I don't like typing out colons and braces all the time and I don't like all the space they take up on screen. I *could* put up with it, but that's not how I roll.


Tests
=====

Run tests with `npm run test`
