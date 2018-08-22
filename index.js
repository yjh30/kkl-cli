#!/usr/bin/env node

const program = require('commander')
const utils = require('./utils')

program
  .version('1.0.1', '-v, --version')
  .command('init <projectName>')
  .action(async projectName => {
    await utils.init(projectName)
  })

program.parse(process.argv)
