const stringToLineObjects = require('./src/stringToLineObjects')
const ASTCreator = require('./src/ASTCreator')
const util = require('util')

function Lass (input = '') {
  const NUM_INDENT_SPACES = 2
  const SPACE_CHAR = ' '
  const COMMA_CHAR = ','

  // Types
  const OBJECT_DEFINITION = "OBJECT_DEFINITION"
  const OBJECT_PROPERTY = "OBJECT_PROPERTY"
  const OBJECT_VALUE = "OBJECT_VALUE"
  const STATEMENT = "STATEMENT"
  const RULE = "RULE"
  const ATRULE = "ATRULE"

  // First pass splitting on new lines to create an array of objects representing each line
  // Preparse
  const lineObjs = stringToLineObjects(input, { NUM_INDENT_SPACES })

  // Create a Parse Tree
  const tree = ASTCreator()

  // Tokeniser
  // Define what each line is (based on the relationship between lines) and add it to the Parse Tree
  lineObjs.forEach((curr, i) => {
    const lineNum = i + 1
    const next = getNextMeaningful(lineObjs, i)

    // @TODO Catch indent greater than NUM_INDENT_SPACES
    // if (next.indent !== curr.indent + 1) {
    //   console.error(`Indentation error for line ${next.lineNum}`)
    // }

    // Comments and empty lines
    if (! curr.content) {
      return tree.addEmptyLine(lineNum)
      // whitespaceLines.push(curr.lineNum)
      // return // skip
    }


    // Object definitions
    if (isObjectDefinition(curr.content)) {
      return tree.add(curr, OBJECT_DEFINITION)
    }
    if (tree.includesType(OBJECT_DEFINITION, curr.indent)) {
      if (! next || next.indent < curr.indent) {
        return tree.add(curr, OBJECT_VALUE)
      }
      if (next.indent === curr.indent) {
        return tree.add(curr, OBJECT_VALUE)
      }
      if (next.indent > curr.indent) {
        return tree.add(curr, OBJECT_PROPERTY)
      }
    }


    // Single line @ At rules (does not include media queries which are statements)
    if (isAtRule(curr.content)) {
      return tree.add(curr, ATRULE)
      // @TODO warn for indentation
    }

    // Statements
    // @media
    // if (tree.includesType(STATEMENT)) {
      if (! next || next.indent < curr.indent) {
        return tree.add(curr, RULE)
      }
      if (next.indent === curr.indent) {
        return tree.add(curr, RULE)
      }
      if (next.indent > curr.indent) {
        return tree.add(curr, STATEMENT)
      }
    // }

    console.error(`Condition not met for ${curr.lineNum}`)
  })

  // tree.log()
  const whitespaceLines = tree.emptyLines()

  return tree.ast()
    .map(iterateNodes)
    .join(`\n`) + '\n'

  function maybeNewLine (lineNum, count = 0) {
    const front = whitespaceLines[0]
    if (! front) return '\n'.repeat(count)
    if (lineNum < front) return '\n'.repeat(count)

    // Remove the first item from the array, and check for any additional empty lines
    whitespaceLines.shift()
    return maybeNewLine(lineNum, count + 1)
  }

  function iterateNodes (node, i, arr) {
    const indentChars = `  `.repeat(node.indent)
    const [ openTag, closeTag ] = symbols(node.type)
    const isLastChild = i === arr.length - 1
    const separatorChar = isLastChild ? '' : separator(node.type)

    let content = node.content

    // console.log(node.lineNum)
    const _maybeNewLine = maybeNewLine(node.lineNum)


    if (node.type === RULE) {
      content = `${node.prop}: ${node.val};`
    }

    if (node.type === ATRULE) {
      return _maybeNewLine + indentChars + node.content + ';'
    }

    const children = node.children.length
      ? '\n' + node.children.map(iterateNodes).join('\n')
      : ''

    // We don't have a nice way of dealing with comments appearing *after* separator characters and closeTags, so we only show them when nodes have children and we can be sure not to have them end up in the wrong place.
    const comment = node.comment
      ? ` // ${node.comment} [${node.lineNum}]`
      :` // [${node.lineNum}]`
    const showComment = (node.type === ATRULE)// || children

    return `` +
      _maybeNewLine +
      indentChars +
      content +
      openTag +
      (! children ? separatorChar : '') +
      children +
      closeTag +
      (children ? separatorChar : '') +
      ''
  }


  function symbols (type) {
    switch (type) {
      case OBJECT_DEFINITION:
        return [`: l(`, `);`]
      case OBJECT_PROPERTY:
        return [` l(`, `)`]
      case OBJECT_VALUE:
        return [``, ``]
      case STATEMENT:
        return [` {`, `}`]
      default:
        return [``, ``]
    }
  }

  function separator (type) {
    switch (type) {
      case OBJECT_PROPERTY:
      case OBJECT_VALUE:
        return ','
      default:
        return ''
    }
  }


  function isAtRule (str) {
    if (str.startsWith('@import')) return true
    if (str.startsWith('@plugin')) return true
    return false
  }

  function isObjectDefinition (str) {
    // @palette
    //   greenHaze #24c875
    //   scienceBlue #003CE1
    //   alabaster #f7f7f7
    return str.match(/^@[a-zA-Z-\d]+$/)
  }

  function replaceObjectReference (str) {
    // `@Typography.body.font-size` -> `at(at(@Typography, body), font-weight)`
    return str.replace(/(@[a-zA-Z-\d]+\.[a-zA-Z-\d.]+)/g, (match) => {
      // https://regex101.com/r/LnGhNw/1
      return match
        .split('.')
        .reduce((acc, x, i) => {
          if (i === 0) return x // @Typography
          return `at(${acc}, ${x})` // at(@Typography, body)
        }, '')
    })
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


module.exports = Lass
