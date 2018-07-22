Lass
====

> it's {Less} with just a little less.

Lass is an opinionated syntax for [Less CSS](http://lesscss.org/) that omits colons, semicolons, brances, and quotes in favour of indentation.

It has *most* of the features of Less, and assumes that you are familiar with Less.


Examples
--------

```
// lass
@color #ffcc00

.thing
  background-color @color
  font-size 16px
```

turns into:

```
// css
.thing {
  background-color: #ffcc00;
  font-size: 16px;
}
```

Just like Less (and because it's built on Less) you can reference parent selectors with `&`.

```
// lass
a
  color blue

  &:hover
    color green
```

turns into:

```
// css
a {
  color: blue;
}

a:hover {
  color: green;
}
```

CSS properties can have their values indented.

```
.example
  background-color pink
  transition
    opacity 0.3s,
    transform 0.3s,
    color 0.3s
  background
    red
    url(tile.png)
    repeat
```

Note that the commas in the `transition` property above have meaning in css and are nothing to do with Lass' syntax.

Note also that interpolated properties don't work:

```
@property background

.bg
  @{background} // <-- WILL NOT WORK
    red
    url(tile.png)
    repeat
```


Plus, object variables!
-----------------------

In Lass you can define variables as objects and access properties using dot notation.

```
@palette
  primary #0000E0
  secondary #02d7e1
  warn red
  social
    facebook #3b5998
    twitter #00aced
    youtube #bb0000

// Usage
.btn
  background-color @palette.primary

.facebook-thing
  color @palette.social.facebook
```


Usage
-----

TBA


Things to Know
--------------

Indentation is two (2) spaces. Don't like it? You can't change it.

Under the hood Lass compiles to less, which then compiles to css using the [less-plugin-lists](https://github.com/seven-phases-max/less-plugin-lists) plugin.


Why?
----

I really, really like the features of Less — especially the error reporting and import-once behaviour — but I don't like typing out colons and braces all the time and I don't like all the space they take up on screen. I *could* put up with it, but that's not how I roll.


Tests
=====

Run tests with `npm run test`
