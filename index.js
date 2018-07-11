const stringToLineObjects = require('./src/stringToLineObjects')
const ASTCreator = require('./src/ASTCreator')
const util = require('util')

function Lass (input = '') {
  const NUM_INDENT_SPACES = 2
  const SPACE_CHAR = ' '
  const COMMA_CHAR = ','
  const INDENT_SYMBOL = SPACE_CHAR.repeat(NUM_INDENT_SPACES)

  const config = {
    NUM_INDENT_SPACES
  }

  const lineObjs = stringToLineObjects(input, config)

  // Do a second pass to determine the relationship between lines
  // Processing states
  const OBJECT_DEFINITION = "OBJECT_DEFINITION"
  const OBJECT_PROPERTY = "OBJECT_PROPERTY"
  const OBJECT_VALUE = "OBJECT_VALUE"
  const STATEMENT = "STATEMENT"
  const RULE = "RULE"
  const EMPTY = "EMPTY"
  const UNKNOWN = "UNKNOWN"
  const COMMENT = "COMMENT"
  const ATRULE = "ATRULE"
  // const MEDIAQUERY = "MEDIAQUERY"

  const tree = ASTCreator()

  let whitespaceLines = []


  const lineObjsLength = lineObjs.length
  let lineNum = undefined
  let node = undefined
  for (let i = 0; i < lineObjsLength; i++) {
    (() => {
      lineNum = i + 1
      const curr = lineObjs[i]
      const next = getNextMeaningful(lineObjs, i)

      // @TODO Catch indent greater than NUM_INDENT_SPACES
      // if (next.indent !== curr.indent + 1) {
      //   console.error(`Indentation error for line ${next.lineNum}`)
      // }


      // console.log(tree.curr())

      // Comments and empty lines
      if (! curr.content) {
        // if (curr.comment) {
        //   if (next && next.indent > curr.indent) {
        //     console.error("You can not have children of comments")
        //     // Maybe in future we will add the ability for anything nested inside a comment to be "commented out". So in-part this is preventing future breaking changes as well as keeping our parser as simple as possible for now.
        //   }
        //   // return tree.add(curr, COMMENT)
        //   whitespaceLines.push(curr.lineNum)
        //   return false // skip
        // }
        // So, it might be that empty lines and their lack of indentation is breaking the way children are added into the AST
        // The problem is:
        // a) empty lines often have an indent of 0, breaking the tree's understanding of what children follow, and
        // b) comments can be treated as children, meaning that any separators applied to comments will add incorrect syntax
        // console.log(EMPTY, tree.currentIndent())
        // curr.indent = tree.curr().indent)
        // return tree.add(curr, EMPTY)
        whitespaceLines.push(curr.lineNum)
        return // skip
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

      // tree.add(curr, UNKNOWN)


      // ---

      // if (! next || next.indent < curr.indent) {
      //   // Curr is last in tip of branch
      //   // Case for the very last line
      //   curr.closingSymbol = ! next
      //     ? popIndentStack(curr.indent)
      //     : popIndentStack(curr.indent - next.indent)

      //   if (multiLineExpression) {
      //     multiLineExpression = false
      //     curr.content = curr.content + ';'
      //     // Don't parse if we know it's not part of a multiLineExpression
      //     return writeLine(curr)
      //   }

      //   curr.content = parseDeclaration(curr.content)
      //   return writeLine(curr)
      // }

      // if (next.indent === curr.indent) {
      //   // No nesting follows
      //   if (multiLineExpression) {
      //     curr.content = (curr.content + multiLineExpression).trim()
      //     return writeLine(curr)
      //   }
      //   if (inObjectDefinition !== false) {
      //     console.log(inObjectDefinition, curr.indent)
      //     // inObjectDefinition = inObjectDefinition -
      //     curr.content = curr.content + ','
      //     return writeLine(curr)
      //   }
      //   else if (curr.content.endsWith(',')) {
      //     // Multi/Group selector
      //     return writeLine(curr)
      //   }

      //   // Single line statements like @import,
      //   // Property:value declarations, or
      //   // Single line mixins
      //   curr.content = parseDeclaration(curr.content)
      //   return writeLine(curr)
      // }

      // if (next.indent > curr.indent) {
      //   // Children follow
      //   // Catch indent greater than NUM_INDENT_SPACES
      //   if (next.indent !== curr.indent + 1) {
      //     console.error(`Indentation error for line ${next.lineNum}`)
      //   }
      //   if (curr.content.startsWith('+')) {
      //     // remove starting '+' and trailing ')'
      //     // @TODO handle id (#) mixins
      //     curr.content = curr.content.replace('+', '.')
      //     curr.content = curr.content.slice(0, -1) + ',' // remove trailing ')'
      //     pushIndentStack(curr.lineNum, curr.indent, '});')
      //     curr.openingSymbol = '{'
      //     return writeLine(curr)
      //   }
      //   if (curr.content.endsWith('[,]')) {
      //     multiLineExpression = COMMA_CHAR
      //     curr.content = curr.content.replace('[,]', '') + ':'
      //     pushIndentStack(curr.lineNum, curr.indent, '')
      //     return writeLine(curr)
      //   }
      //   if (curr.content.endsWith('[ ]')) {
      //     multiLineExpression = SPACE_CHAR
      //     curr.content = curr.content.replace('[ ]', '') + ':'
      //     pushIndentStack(curr.lineNum, curr.indent, '')
      //     return writeLine(curr)
      //   }
      //   pushIndentStack(curr.lineNum, curr.indent, '}')
      //   curr.openingSymbol = '{'
      //   return writeLine(curr)
      // }

      console.error(`Condition not met for ${curr.lineNum}`)
    })()
  } // for

  tree.log()

  return tree.ast()
    .map(iterateNodes)
    // .join(`\n`)
    // .split(`\n`)
    // .map(applyComments)
    .join(`\n`) + '\n'

  function applyComments (str, i) {
    console.log(str, i, lineComments[i])
    return lineComments[i]
      ? str + ' // ' + lineComments[i]
      : str
  }

  function maybeNewLine (lineNum, count = 0) {
    const front = whitespaceLines[0]
    if (! front) return '\n'.repeat(count)
    if (lineNum < front) return '\n'.repeat(count)

    // Remove the first item from the array, and
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

    // if (node.type === EMPTY) {
    //   return ``
    // }

    // if (node.type === COMMENT) {
    //   return ``
    // }

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


    // if (node.lineNum === 16)
    //   console.log(util.inspect(node, false, null))


    return `` +
      _maybeNewLine +
      indentChars +
      content +
      openTag +
      // (showComment ? comment : '') +
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

  function writeLine (obj) {
    const indentChars = '  '.repeat(obj.indent)
    // let sep = ''
    // if (obj.isLast) sep = separator(obj.type)
    const sep = !!obj.isLast ? '' : separator(obj.type)

    // console.log((!!obj.isLast ? '- ' : 'X ') + obj.lineNum + ' :: ' + obj.content + sep)
    const open = symbols(obj.type)[0]
    const close = obj.stack
      ? obj.stack.map(x => symbols(x.type)[1]).join('')
      : ''
    const comment = obj.comment

    return indentChars +
      obj.content +
      sep +
      open +
      close +
      (obj.content && obj.comment ? ' ' : '') +
      (comment ? '// ' + comment : '')
  }

  function isAtRule (str) {
    if (str.startsWith('@import')) return true
    if (str.startsWith('@plugin')) return true
    return false
  }

  function isMediaQuery (str) {
    if (str.startsWith('@media')) return true
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

  function parseDeclaration (content) {
    if (content.startsWith('@import'))
      return content + ';'

    if (content.startsWith('@plugin'))
      return content + ';'

    let [prop, val] = splitOnce(content, ' ')
    prop = prop.trim()
    val = val.trim()

    if (prop && val) {
      prop = replaceObjectReference(prop)
      val = replaceObjectReference(val)
      return prop + ': ' + val + ';'
    }

    content = replaceObjectReference(content)
    return content + ';'
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

function padStart (str, padString, length) {
  while (str.length < length)
    str = padString + str
  return str
}


module.exports = Lass
