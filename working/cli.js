#! /usr/bin/env node

const lass = require('../index')
const less = require('less')
const lessPluginLists = require('less-plugin-lists')

const argv = require('yargs').argv
const fs = require('fs')
const path = require('path')


const lassPlugin = {
  priority: 1, // 1 = before import, 1000 = import, 2000 = after import
  install: function(less, pluginManager) {
    pluginManager.addPreProcessor({
      process: lass.render
    }, this.priority);
  }
}

const listsPlugin = new lessPluginLists()


if (argv._ && argv._.length > 1) {
  const filein = argv._[0];
  const fileout = argv._[1];
  const inPath = path.resolve(__dirname, `${filein}`)
  const str = fs.readFileSync(inPath, 'utf8')

  less
    .render(str, {
      plugins: [ lassPlugin, listsPlugin ],
      filename: inPath,
      strictMath: true,
    })
    .then((out) => {
      fs.writeFileSync(
        path.resolve(__dirname, `${fileout}`),
        out.css,
        'utf8'
      )
    })

} else {
  console.error('{in} {out}')
}
