const Lass = require('../index')
const fs = require('fs')
const path = require('path')


runtest('biteable.button')
runtest('tlc.form')

runtest('at-rules')
runtest('many')
runtest('many-more')
runtest('mixins-with-rules')
runtest('multi-line-properties')
runtest('plugin-lists-objects')
runtest('properties')


function runtest (name) {
  const less = fs.readFileSync(path.resolve(__dirname, `./less/${name}.less`), 'utf8')
  const lass = fs.readFileSync(path.resolve(__dirname, `./lass/${name}.lass`), 'utf8')
  // Jest
  test(name, () => {
    expect(Lass.render(lass)).toBe(less);
  })
}


