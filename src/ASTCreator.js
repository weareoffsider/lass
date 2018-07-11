const util = require('util')

module.exports = function () {
  const _tree = []
  let indent = 0
  let pointer = []
  let typeArr = []
  // let commentLines = {}
  // let whitespaceLines = []

  return {
    add,
    log,
    getTypeArr: () => typeArr,
    includesType: (type, indent) => {
      return typeArr.slice(0, indent).includes(type)
      // The slice here makes sure we only look at a portion of the typeArr in the tree above the specified indent
    },
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
      prop: line.prop || '',
      val: line.val || '',
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

  function add (line, type) {
    line.type = type

    // if (type === EMPTY) {
    //   return
    //   // line.indent = indent
    // }

    // if (type === COMMENT) return

    const atIndent = line.indent
    if (atIndent > indent) {
      // Add as child of node at pointer
      const node = getBranchAtPointer(pointer)
      const length = pushToBranch(node, line)
      // Update pointers
      pointer.push(0)
      typeArr.push(type)
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
      typeArr = typeArr.slice(0, -1).concat([type])
      // console.log(typeArr, pointer, '=', line.lineNum)
    }

    if (atIndent < indent) {
      // Add as child of the parent up the tree at the atIndent
      const pointerAtIndent = pointer.slice(0, atIndent)
      const node = getBranchAtPointer(pointerAtIndent)
      const length = pushToBranch(node, line)
      // Update pointer
      pointer = pointerAtIndent.concat([length - 1])
      typeArr = typeArr.slice(0, atIndent).concat([type])
      // console.log(typeArr, pointer, '<', line.lineNum, atIndent)
    }

    indent = atIndent
  }

  function log () {
    console.log(util.inspect(_tree, false, null))
  }
}
