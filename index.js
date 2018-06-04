const sample = `.class
  &__something
    &::hover
      color red

@import "something";

// Comment
@link-color #428bca // a nice purple
@my-selector link

.classname
  property value
  font-size 8, 2, 4

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
      // indent = currIndent / NUM_INDENT_SPACES
      writeStatementStart(curr, lineNum)
    }
    else {
      console.log(`Condition not met for ${lineNum}`)
    }
    // console.log(lineNum, indent)
  }

  console.log(parsedLines.join('\n'))

  //
  function isMultiSelector (line) {
    return line.trim().endsWith(',')
  }

  function writeEmpty (line, lineNum) {
    parsedLines.push(``)
  }

  function writeUnchanged (line, lineNum) {
    parsedLines.push(`${line} // [${lineNum}]`)
  }

  function writeDeclaration (line, lineNum) {
    parsedLines.push(`${line}; // [${lineNum}]`)
  }

  function writeDeclarationAndStatmentEnd (line, lineNum, currIndent, nextIndent) {
    const rep = (currIndent - nextIndent) / NUM_INDENT_SPACES
    const brackets = '}'.repeat(rep)
    parsedLines.push(`${line}; ${brackets} // [${lineNum}]`)
  }

  function writeStatementStart (line, lineNum) {
    parsedLines.push(`${line} { // [${lineNum}]`)
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

function padStart (str, padString, length) {
  while (str.length < length)
    str = padString + str
  return str
}
