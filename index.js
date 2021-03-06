const stringToLineObjects = require('./src/stringToLineObjects')
const ASTCreator = require('./src/ASTCreator')
const cssProperties = require('./src/properties')
const util = require('util')
const path = require('path')
const LOG_TREE = false


const Lass = {
  render,
  plugin: {
    priority: 1, // 1 = before import, 1000 = import, 2000 = after import
    install: function(less, pluginManager) {
      pluginManager.addPreProcessor({
        process: render
      }, this.priority);
    }
  },
}

function render (input = '', context = null) {
  if (context && context.fileInfo) {
    const ext = path.extname(context.fileInfo.filename)
    if (ext !== '.lass') {
      return input
    }
  }

  const NUM_INDENT_SPACES = 2

  // Types
  const OBJECT_DEFINITION = "OBJECT_DEFINITION"
  const OBJECT_PROPERTY = "OBJECT_PROPERTY"
  const OBJECT_VALUE = "OBJECT_VALUE"
  const STATEMENT = "STATEMENT"
  const MULTILINE_SELECTOR = "MULTILINE_SELECTOR"
  const MIXIN_STATEMENT = "MIXIN_STATEMENT"
  const RULE = "RULE"
  const MULTILINE_PROPERTY = "MULTILINE_PROPERTY"
  // const MULTILINE_PROPERTY_COMMA = "MULTILINE_PROPERTY_COMMA"
  const MULTILINE_VALUE = "MULTILINE_VALUE"
  // const MULTILINE_VALUE_COMMA = "MULTILINE_VALUE_COMMA"
  const ATRULE = "ATRULE"
  const EXTEND = "EXTEND"

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


    if (isExtendRule(curr.content)) {
      return tree.add(curr, EXTEND)
    }


    if (
      next &&
      next.indent === curr.indent &&
      curr.content.endsWith(',')
    ) {
      return tree.add(curr, MULTILINE_SELECTOR)
    }

    // Single line @ At rules (does not include media queries which are statements)
    if (isAtRule(curr.content)) {
      return tree.add(curr, ATRULE)
      // @TODO warn for indentation
    }

    // if (tree.parentType(curr.indent) === MULTILINE_PROPERTY_COMMA) {
    //   return tree.add(curr, MULTILINE_VALUE_COMMA)
    // }
    if (tree.parentType(curr.indent) === MULTILINE_PROPERTY) {
      return tree.add(curr, MULTILINE_VALUE)
    }

    // Statements
    // @media
    if (! next || next.indent < curr.indent) {
      return tree.add(curr, RULE)
    }
    if (next.indent === curr.indent) {
      return tree.add(curr, RULE)
    }

    if (tree.includesType(STATEMENT)) {
      if (next && next.indent > curr.indent) {
        if (curr.prop && ! curr.val) {
          // if (cssProperties.commaSeparated.indexOf(curr.prop) !== -1) {
          //   return tree.add(curr, MULTILINE_PROPERTY_COMMA)
          // }
          if (cssProperties.all.indexOf(curr.prop) !== -1) {
            return tree.add(curr, MULTILINE_PROPERTY)
          }
        }
      }
    }

    if (next.indent > curr.indent) {
      if (isMixinWithRules(curr.content)) {
        curr.content = transformMixinWithRules(curr.content)
        return tree.add(curr, MIXIN_STATEMENT)
      }

      return tree.add(curr, STATEMENT)
    }

    console.error(`Condition not met for ${curr.lineNum}`)
  })

  if (LOG_TREE) tree.log()
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

    const _maybeNewLine = maybeNewLine(node.lineNum)

    if (node.type === RULE) {
      // Not all rules have a prop and value, eg
      // `.mymixin(#ffcc00)` or `@rules()`
      if (node.val) {
        content = `${node.prop}: ${node.val};`
      } else {
        content = `${node.prop};`
      }
    }

    if (node.type === EXTEND) {
      return _maybeNewLine + indentChars + node.content + ';'
    }

    if (node.type === ATRULE) {
      if (node.prop === '@import') {
        // Append .lass automatically if no file extension
        if (
          ! node.val.endsWith('.lass') &&
          ! node.val.endsWith('.less') &&
          ! node.val.endsWith('.css')
        ) {
          node.val = node.val + '.lass'
        }
      }
      // Quote path: `@import (rule) something` --> `@import (rule) "something"
      const path = node.val.split(" ").slice(-1)
      node.val = node.val.replace(path, '"' + path + '"')
      return _maybeNewLine + indentChars + node.prop + ' ' + node.val + ';'
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
      replaceObjectReference(content) +
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
      case MIXIN_STATEMENT:
        return [`, {`, `});`]
      case MULTILINE_PROPERTY:
      // case MULTILINE_PROPERTY_COMMA:
        return [`:`, `;`]
      default:
        return [``, ``]
    }
  }

  function separator (type) {
    switch (type) {
      case OBJECT_PROPERTY:
      case OBJECT_VALUE:
      // case MULTILINE_VALUE_COMMA:
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

  function isExtendRule (str) {
    return str.includes(':extend')
  }

  function isObjectDefinition (str) {
    // @palette
    //   greenHaze #24c875
    //   scienceBlue #003CE1
    //   alabaster #f7f7f7
    return str.match(/^@[a-zA-Z-\d]+$/)
  }

  function isMixinWithRules (str) {
    return str.startsWith('+')
  }

  function transformMixinWithRules (str) {
    // @TODO handle id (#) mixins
    return '.' + str.slice(1, -1) // remove starting '+' and trailing ')'
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
