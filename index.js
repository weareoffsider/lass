function Lass (input = '') {
  const NUM_INDENT_SPACES = 2
  const SPACE_CHAR = ' '
  const COMMA_CHAR = ','

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
      meaningful: content ? true : false,
      lineNum,
      indent,
      content,
      comment,
    })
  }

  // Do a second pass to determine the relationship between lines
  // Processing states
  const indentStack = []
  let multiLineExpression = false // COMMA_CHAR or SPACE_CHAR

  const lineObjsLength = lineObjs.length
  const out = []
  let lineNum = undefined
  for (let i = 0; i < lineObjsLength; i++) {
    out.push((() => {
      lineNum = i + 1
      const curr = lineObjs[i]

      if (!curr.content) {
        return writeLine(curr)
      }
      else {
        const next = getNextMeaningful(lineObjs, i)
        if (! next || next.indent < curr.indent) {
          // Curr is last in tip of branch
          // Case for the very last line
          curr.closingSymbol = ! next
            ? popIndentStack(curr.indent)
            : popIndentStack(curr.indent - next.indent)

          if (multiLineExpression) {
            multiLineExpression = false
            curr.content = curr.content + ';'
            // Don't parse if we know it's not part of a multiLineExpression
            return writeLine(curr)
          }

          curr.content = parseDeclaration(curr.content)
          return writeLine(curr)
        }
        else if (next.indent === curr.indent) {
          // No nesting follows
          if (multiLineExpression) {
            curr.content = (curr.content + multiLineExpression).trim()
            return writeLine(curr)
          }
          else if (curr.content.endsWith(',')) {
            // Multi/Group selector
            return writeLine(curr)
          }
          else {
            // Single line statements like @import,
            // Property:value declarations, or
            // Single line mixins
            curr.content = parseDeclaration(curr.content)
            return writeLine(curr)
          }
        }
        else if (next.indent > curr.indent) {
          // Children follow
          // Catch indent greater than NUM_INDENT_SPACES
          if (next.indent !== curr.indent + 1) {
            console.error(`Indentation error for line ${next.lineNum}`)
          }
          if (curr.content.startsWith('+')) {
            // remove starting '+' and trailing ')'
            // @TODO handle id (#) mixins
            curr.content = curr.content.replace('+', '.')
            curr.content = curr.content.slice(0, -1) + ',' // remove trailing ')'
            pushIndentStack(curr.lineNum, curr.indent, '});')
            curr.openingSymbol = '{'
            return writeLine(curr)
          }
          if (curr.content.endsWith('[,]')) {
            multiLineExpression = COMMA_CHAR
            curr.content = curr.content.replace('[,]', '') + ':'
            pushIndentStack(curr.lineNum, curr.indent, '')
            return writeLine(curr)
          }
          if (curr.content.endsWith('[ ]')) {
            multiLineExpression = SPACE_CHAR
            curr.content = curr.content.replace('[ ]', '') + ':'
            pushIndentStack(curr.lineNum, curr.indent, '')
            return writeLine(curr)
          }
          if (contentIsObjectDefinition(curr.content)) {
            console.log('contentIsObjectDefinition')
            console.log(curr)
            // @TODO instead of multiple stacks, why not manage a single stack with a type eg type: OBJECT_DEFINITION
            curr.content = curr.content + ':'
            return writeLine(curr)
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

  function contentIsObjectDefinition (str) {
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
