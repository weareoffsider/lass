function Lass (input = '') {
  const NUM_INDENT_SPACES = 2
  const SPACE_CHAR = ' '
  const COMMA_CHAR = ','
  const INDENT_SYMBOL = SPACE_CHAR.repeat(NUM_INDENT_SPACES)

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

    const [content, comment] = splitOnce(line.trim(), '//')
    const [prop, val] = splitOnce(content || '', ' ')

    // console.log(lineNum, indent, content, comment)

    lineObjs.push({
      meaningful: content ? true : false, // isMeaningful @TODO
      lineNum,
      indent,
      content: content.trim(),
      prop: prop.trim(),
      val: val.trim(),
      comment: comment.trim(),
    })
  }

  // Do a second pass to determine the relationship between lines
  // Processing states
  const OBJECT_DEFINITION = "OBJECT_DEFINITION"
  const OBJECT_PROPERTY = "OBJECT_PROPERTY"
  const OBJECT_VALUE = "OBJECT_VALUE"
  const STATEMENT = "STATEMENT"
  const RULE = "RULE"
  const EMPTY = "EMPTY"

  const tree = (() => {
    const _tree = []
    let indent = 0
    let pointer = []
    let typeArr = []

    return {
      add,
      log,
      includesType: (type) => typeArr.includes(type),
      ast: () => _tree,
    }

    function getBranchAtPointer (pointerArr) {
      // eg [0, 1, 4, 0]
      if (pointerArr.length === 0) {
        return _tree
      }
      let branch = null
      pointerArr.forEach(x => {
        if (! branch) {
          branch = _tree[x]
        } else {
          branch = branch.children[x]
        }
      })
      return branch
    }

    function nodeChildrenLength (node) {
      if (node.children !== undefined) {
        return node.children.length
      } else {
        return node.length
      }
    }

    function pushToBranch (branch, line) {
      const _line = {
        lineNum: line.lineNum,
        indent: line.indent || 0,
        type: line.type,
        content: line.content || '',
        comment: line.comment || '',
        children: [],
      }
      if (branch === undefined) {
        console.log(line)
      }
      if (branch.children !== undefined) {
        branch.children.push(_line)
        return branch.children.length
      } else {
        branch.push(_line)
        return branch.length
      }
    }

    function add (line) {
      const atIndent = line.indent
      if (atIndent > indent) {
        // Add as child of node at pointer
        const node = getBranchAtPointer(pointer)
        const length = pushToBranch(node, line)
        // Update pointers
        pointer.push(0)
        typeArr.push(line.type)
        // console.log(typeArr, pointer, '>', line.lineNum)
      }

      if (atIndent === indent) {
        // Add as sibling of node at current pointer
        const parentPointer = pointer.slice(0, -1)
        // console.log(parentPointer)
        const node = getBranchAtPointer(parentPointer)
        const length = pushToBranch(node, line)
        // Update pointers
        pointer = parentPointer.concat([length - 1])
        typeArr = typeArr.slice(0, -1).concat([line.type])
        // console.log(typeArr, pointer, '=', line.lineNum)
      }

      if (atIndent < indent) {
        // Add as child of the parent up the tree at the atIndent
        const pointerAtIndent = pointer.slice(0, atIndent)
        const node = getBranchAtPointer(pointerAtIndent)
        const length = pushToBranch(node, line)
        // Update pointer
        pointer = pointerAtIndent.concat([length - 1])
        typeArr = typeArr.slice(0, atIndent).concat([line.type])
        // console.log(typeArr, pointer, '<', line.lineNum, atIndent)
      }

      indent = atIndent

      return node
    }

    function log () {
      console.log(_tree)
    }
  })()

  const lineObjsLength = lineObjs.length
  let lineNum = undefined
  let node = undefined
  for (let i = 0; i < lineObjsLength; i++) {
    (() => {
      lineNum = i + 1
      const curr = lineObjs[i]
      const next = getNextMeaningful(lineObjs, i)


      if (! curr.content) {
        curr.type = EMPTY
        node = tree.add(curr)
        return
        // return writeLine(curr)
      }


      if (isObjectDefinition(curr.content)) {
        curr.type = OBJECT_DEFINITION
        node = tree.add(curr)
        return
      }

      if (tree.includesType(OBJECT_DEFINITION)) {
        if (! next || next.indent < curr.indent) {
          curr.type = OBJECT_VALUE
          node = tree.add(curr)
          return
        }
        if (next.indent === curr.indent) {
          curr.type = OBJECT_VALUE
          return tree.add(curr)
        }
        if (next.indent > curr.indent) {
          curr.type = OBJECT_PROPERTY
          node = tree.add(curr)
          return
        }
      }

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

      //   if (inObjectDefinition !== false) {
      //     if (curr.indent === inObjectDefinition) {
      //       inObjectDefinition = false
      //     }
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

  // tree.log()
  // console.log(tree.ast())

  return tree.ast().map(iterateNodes).join(`\n`)

  function iterateNodes (node, i, arr) {
    const indentChars = `  `.repeat(node.indent)
    const [ openTag, closeTag ] = symbols(node.type)
    const isLastChild = i === arr.length - 1
    const separatorChar = isLastChild ? '' : separator(node.type)

    console.log({
      IS_LAST: i === arr.length - 1,
      lineNum: node.lineNum,
      i,
      arrLength: arr.length,
      separatorChar,
      type: node.type,
      indentChars,
      openTag,
      closeTag,
    })

    const children = node.children.length
      ? '\n' + node.children.map(iterateNodes).join('\n')
      : ''

    return `` +
      indentChars +
      node.content +
      openTag +
      (! children ? separatorChar : '') +
      (node.comment ? ` // ${node.comment}` : ``) +
      // ` // [${node.lineNum}]` +
      children +
      closeTag +
      (children ? separatorChar : '') +
      ''
  }


  // function writeFromTree (tree) {
  //   function createLine (obj, i, arr) {
  //     {
  //       type,
  //       indent,
  //       content,
  //       comment,
  //     } = obj

  //     const indentChars = '  '.repeat(obj.indent)
  //     const last = i === arr.length - 1
  //     const sep = last ? '' : separator(obj.type)

  //     // console.log((!!obj.isLast ? '- ' : 'X ') + obj.lineNum + ' :: ' + obj.content + sep)
  //     const open = symbols(type)[0]
  //     // const close = obj.stack
  //     //   ? obj.stack.map(x => symbols(x.type)[1]).join('')
  //     //   : ''
  //     const comment = obj.comment + ` [${obj.lineNum}]`

  //     return indentChars +
  //       obj.content +
  //       sep +
  //       open +
  //       close +
  //       (obj.content && obj.comment ? ' ' : '') +
  //       (comment ? '// ' + comment : '')
  //   }
  // }


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
      case OBJECT_DEFINITION:
      case OBJECT_PROPERTY:
      case OBJECT_VALUE:
        return ','
      default:
        return ''
    }
  }

  // function endOfLine (type, isLast = false) {
  //   switch (type) {
  //     case OBJECT_VALUE:
  //       return ! isLast ? ',' : ''
  //     case RULE:
  //       return ';'
  //     default:
  //       return ''
  //   }
  // }

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

  // function pushIndentStack (lineNum, indent, closingSymbol, type = undefined) {
  //   indentStack.push({
  //     type,
  //     lineNum,
  //     indent,
  //     closingSymbol,
  //   })
  // }

  // function popIndentStack (indent) {
  //   const closing = []
  //   for (let i = 0; i < indent; i++) {
  //     closing.push(indentStack.pop().closingSymbol)
  //   }
  //   return closing.join('')
  // }

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
