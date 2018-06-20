const sample = `.class
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

const next = `
.animation
  transition (
    opacity 1s,
    color 1s
  )

  // or, where the parse knows which properties are space and comma separated
  transition[,]
    opacity 1s
    color 1s

  background[ ]
    no-repeat
    url()
    center
    cover

  transform[ ]
    rotate(90deg)
    translateY(-50%)
`

const objs = `

@object: {
  foo: 1
  bar: 2
}

// into
@object______foo: 1;
@object______bar: 1;
`

/*
Terms
-----
selector
property + value = declaration
multiple declarations = declaration block
selector + declaration block = ruleset
at-rule
nested statements
*/


Lass(sample)
function Lass (input = '') {
  const NUM_INDENT_SPACES = 2

  const lines = input.split('\n')
  const linesLength = lines.length
  const lineObjs = []

  // Do a first pass of all lines, splitting up indentation, content, and comments
  for (let i = 0; i < linesLength; i++) {
    const line = lines[i]
    const lineNum = i + 1

    const _leadingSpaces = leadingSpaces(line)
    const indent = _leadingSpaces / NUM_INDENT_SPACES
    if (_leadingSpaces % NUM_INDENT_SPACES) {
      console.error(`Line ${lineNum} has invalid indentiation. Should be a multiple of ${NUM_INDENT_SPACES}.`)
    }

    let [content, comment] = splitOnce(line.trim(), '//')
    content = content.trim()
    comment = comment.trim()

    // console.log(lineNum, indent, content, comment)

    lineObjs.push({
      // is,
      meaningful: content ? true : false,
      lineNum,
      indent,
      content,
      comment,
      // statementOpen: '',
      // statementClose: '',
    })
  }

  // console.log(lineObjs)

  // Do a second pass to determine the relationship between lines
  const indentStack = []
  const lineObjsLength = lineObjs.length
  const out = []
  for (let i = 0; i < lineObjsLength; i++) {
    out.push((() => {
      const curr = lineObjs[i]

      if (!curr.content) {
        return writeLine(curr)
      }
      else {
        const next = getNextMeaningful(lineObjs, i)
        if (! next) {
          // Case for the very last line
          curr.closingSymbol = popIndentStack(curr.indent, curr.lineNum)
          curr.content = parseDeclaration(curr.content)
          return writeLine(curr)
        }
        else if (next.indent === curr.indent) {
          // No nesting follows
          if (curr.content.endsWith(',')) {
            // Multi/Group selector
            return writeLine(curr)
          } else {
            // Single line statements like @import,
            // Property:value declarations, or
            // Single line mixins
            curr.content = parseDeclaration(curr.content)
            return writeLine(curr)
          }
        }
        else if (next.indent < curr.indent) {
          // Curr is last in tip of branch
          curr.closingSymbol = popIndentStack(curr.indent - next.indent)
          curr.content = parseDeclaration(curr.content)
          return writeLine(curr)
        }
        else if (next.indent > curr.indent) {
          // Children follow
          // Catch indent greater than NUM_INDENT_SPACES
          if (next.indent !== curr.indent + 1) {
            console.error(`Indentation error for line ${next.lineNum}`)
          }

          if (curr.content.startsWith('+')) {
            // remove starting '+' and trailing ')'
            // @TODO handle #mixins (they don't hae to be just . classes)
            curr.content = curr.content.replace('+', '.')
            curr.content = curr.content.slice(0, -1) + ',' // remove trailing ')'
            pushIndentStack(curr.lineNum, curr.indent, '});')
            curr.openingSymbol = '{'
          }
          else {
            pushIndentStack(curr.lineNum, curr.indent, '}')
            curr.openingSymbol = '{'
          }
          // pushIndentStack(curr.lineNum, curr.indent, '}')
          // curr.openingSymbol = '{'
          return writeLine(curr)
        }
        else {
          console.error(`Condition not met for ${curr.lineNum}`)
        }
      }
    })())
  } // for

  // console.log(out.join('\n'))
  return out.join('\n')

  function writeLine (obj) {
    const indentChars = '  '.repeat(obj.indent)
    return indentChars +
      obj.content +
      (obj.openingSymbol
        ? ' ' + obj.openingSymbol
        : ''
      ) +
      (obj.closingSymbol
        ? ' ' + obj.closingSymbol
        : ''
      ) +
      (obj.content && obj.comment ? ' ' : '') +
      (obj.comment
        ? '// ' + obj.comment
        : ''
      )
  }

  function pushIndentStack (lineNum, indent, closingSymbol) {
    indentStack.push({
      lineNum,
      indent,
      closingSymbol,
    })
  }

  function popIndentStack (indent) {
    const closing = []
    for (let i = 0; i < indent; i++) {
      closing.push(indentStack.pop().closingSymbol)
    }
    return closing.join('')
  }

  function parseDeclaration (content) {
    if (content.startsWith('@import'))
      return content + ';'

    if (content.startsWith('@plugin'))
      return content + ';'

    let [prop, val] = splitOnce(content, ' ')
    prop = prop.trim()
    val = val.trim()

    if (prop && val) {
      return prop + ': ' + val + ';'
    }

    return content + ';'
  }

  function leadingSpaces (str) {
    const match = str.match(/^\s+/)
    return ! match
      ? 0
      : match[0].length
  }

  function getNextMeaningful (arr, i) {
    let nextObj = arr[i + 1]
    if (nextObj === undefined)
      return null

    if (nextObj.meaningful)
      return nextObj

    return getNextMeaningful(arr, i + 1)
  }
}



// Util

function splitOnce (str, sep = '') {
  const [first, ...rest] = str.split(sep)
  return [first, rest.join(sep)]
}

function padStart (str, padString, length) {
  while (str.length < length)
    str = padString + str
  return str
}


module.exports = Lass
