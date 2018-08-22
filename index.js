#!/usr/bin/env node

const program = require('commander')
const utils = require('./utils')
const { version } = require('./package.json')

program
  .version(`${version}`, '-v, --version')
  .command('init <projectName>')
  .action(async projectName => {
    await utils.init(projectName)
  })

program.parse(process.argv)
