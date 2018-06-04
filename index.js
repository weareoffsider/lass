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


Parse(sample)
function Parse (input) {
  const NUM_INDENT_SPACES = 2
  const parsedLines = []
  const lines = input.split("\n")
  let lineNum = 1

  for (; lineNum <= lines.length; lineNum++) {
    const curr = currLine()
    const next = getNextLineNotEmpty(lineNum)

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
      writeStatementStart(curr, lineNum)
    }
    else {
      console.log(`Condition not met for ${lineNum}`)
    }
    // console.log(lineNum, indent)
  }


  const l = (parsedLines.length + '').split('').length
  parsedLines.forEach((x, i) => {
    let n = `${padStart((i + 1 + ''), ' ', l)} | `
    n = ''
    console.log(n + x)
  })

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
    const rep = (currIndent - nextIndent) / NUM_INDENT_SPACES
    const brackets = '}'.repeat(rep)
    parsedLines.push(parseDeclaration(line) + ' ' + brackets)
  }

  function writeStatementStart (line, lineNum) {
    parsedLines.push(`${line} {`)
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

  function getNextLineNotEmpty (lineNum, iterated = false) {
    let nextLine = getLine(lineNum + 1)
    if (nextLine === undefined)
      return null

    if (isEmptyLine(nextLine))
      return getNextLineNotEmpty(lineNum + 1, true)

    return nextLine
  }

  function isEmptyLine (line) {
    return line.trim().length === 0
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
