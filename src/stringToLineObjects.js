module.exports = function (input, config) {
  const lines = input.split('\n')
  const linesLength = lines.length
  const lineObjs = []
  const lineComments = []

  // Do a first pass of all lines, splitting up indentation, content, and comments
  for (let i = 0; i < linesLength; i++) {
    const line = lines[i]
    const lineNum = i + 1

    const _leadingSpaces = leadingSpaces(line)
    const indent = _leadingSpaces / config.NUM_INDENT_SPACES
    if (_leadingSpaces % config.NUM_INDENT_SPACES) {
      console.error(`Line ${lineNum} has invalid indentiation. Should be a multiple of ${config.NUM_INDENT_SPACES}.`)
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

    lineComments.push(comment.trim() || '')
  }

  return lineObjs
}


function leadingSpaces (str) {
  const match = str.match(/^\s+/)
  return ! match
    ? 0
    : match[0].length
}

function splitOnce (str, sep = '') {
  const [first, ...rest] = str.split(sep)
  return [first, rest.join(sep)]
}
