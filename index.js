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
          pushIndentStack(curr.lineNum, curr.indent, '}')
          curr.openingSymbol = '{'
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



// Parse(sample)
function Parse (input) {
  const NUM_INDENT_SPACES = 2
  const parsedLines = []
  const lines = input.split("\n")
  let lineNum = 1
  let indentStack = []

  // return false

  for (; lineNum <= lines.length; lineNum++) {
    const curr = currLine()
    const next = getNextMeaningfulLine(lineNum)

    // if (lineNum === 20) {
    //   console.log(curr)
    //   console.log(next)
    //   console.log(' ')
    // }

    // @TODO handle an invalid indent
    const currIndent = indentation(curr)
    const nextIndent = next && indentation(next)

    if (isEmptyLine(curr)) {
      writeEmpty(curr, lineNum)
    }
    else if (isCommentLine(curr)) {
      writeUnchanged(curr, lineNum)
    }
    else if (! next) {
      writeDeclarationAndStatmentEnd(curr, lineNum, currIndent, 0)
    }
    else if (nextIndent === currIndent) {
      if (isMultiSelector(curr)) {
        writeUnchanged(curr, lineNum)
      } else {
        // tip of branch
        writeDeclaration(curr, lineNum)
      }
    }
    else if (nextIndent < currIndent) {
      // curr is last in tip of branch so it must be a declaration
      writeDeclarationAndStatmentEnd(curr, lineNum, currIndent, nextIndent)
    } else if (nextIndent > currIndent) {
      // curr has children
      writeStatementStart(curr, lineNum, currIndent)
    }
    else {
      console.log(`Condition not met for ${lineNum}`)
    }
    // console.log(lineNum, indent)
  }


  const l = (parsedLines.length + '').split('').length
  parsedLines.forEach((x, i) => {
    let n = `${padStart((i + 1 + ''), ' ', l)} | `
    // n = ''
    console.log(n + x)
  })

  return parsedLines.join('\n')

  //
  function isMultiSelector (line) {
    return line.trim().endsWith(',')
  }

  function writeEmpty (line, lineNum) {
    parsedLines.push(``)
  }

  function writeUnchanged (line, lineNum) {
    parsedLines.push(line)
  }

  function writeDeclaration (line, lineNum) {
    parsedLines.push(parseDeclaration(line))
  }

  function writeDeclarationAndStatmentEnd (line, lineNum, currIndent, nextIndent) {
    const depth = (currIndent - nextIndent) / NUM_INDENT_SPACES
    const closing = []
    for (let i = 0; i < depth; i++) {
      closing.push(indentStack.pop().symbol)
    }

    parsedLines.push(parseDeclaration(line) + ' ' + closing.join(''))
  }

  function writeStatementStart (line, lineNum, currIndent) {
    /*
      Special case for mixins that take rules
      +from(768)     |    .from(768, {
        color red    |      color: red;
                     |    })
    */
    if (line.trim().startsWith('+')) {
      let [statement, comment] = splitOnce(line, '//')
      // remove starting '+' and trailing '('
      // @TODO handle #mixins (they don't hae to be just . classes)
      statement = statement.trim().replace('+', '.')
      statement = statement.trim().slice(0, -1)

      const indentSpaces = ' '.repeat(indentation(line))

      parsedLines.push(
        indentSpaces +
        statement + ', {' +
        (comment ? ' //' + comment : '')
      )

      indentStack.push({
        lineNum,
        depth: currIndent / NUM_INDENT_SPACES,
        symbol: '});'
      })
    }
    else {
      parsedLines.push(line + '{')
      indentStack.push({
        lineNum,
        depth: currIndent / NUM_INDENT_SPACES,
        symbol: '}'
      })
    }
  }

  function parseDeclaration (line) {
    const _line = line.trim()

    // Comments
    if (_line.startsWith('//')) {
      return line
    }
    if (_line.startsWith('@import')) {
      return line + ';'
    }
    if (_line.startsWith('@plugin')) {
      return line + ';'
    }

    const [decl, comment] = splitOnce(_line, '//')
    const [prop, val] = splitOnce(decl, ' ')
    const indentSpaces = ' '.repeat(indentation(line))
    const commentStr = comment ? ' //' + comment : ''

    if (prop && val) {
      return indentSpaces +
        prop + ': ' +
        val.trim() + ';' +
        commentStr
    }
    else {
      return indentSpaces +
        decl + ';' +
        commentStr
    }
  }

  function getLine (lineNum) {
    return lines[lineNum - 1]
  }

  function currLine () {
    const curr = getLine(lineNum)
    if (curr === undefined)
      return null

    return curr
  }

  function getNextMeaningfulLine (lineNum, iterated = false) {
    let nextLine = getLine(lineNum + 1)
    if (nextLine === undefined)
      return null

    if (isEmptyLine(nextLine) || isCommentLine(nextLine))
      return getNextMeaningfulLine(lineNum + 1, true)

    return nextLine
  }

  function isEmptyLine (line) {
    return line.trim().length === 0
  }

  function isCommentLine (line) {
    return line.trim().startsWith('//')
  }

  function indentation (line) {
    // @TODO check indent is 0 or multiple of NUM_INDENT_SPACES
    const match = line.match(/^\s+/)
    return ! match
      ? 0
      : match[0].length
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
