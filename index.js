#!/usr/bin/env node

const program = require('commander')
const utils = require('./utils')

program
  .version('0.0.1', '-v, --version')
  .command('init <projectName>')
  .action(async projectName => {
    const isGenerate = await utils.confirmIsGenerate(projectName)

    if (!isGenerate) { return }

    const packageInfo = await utils.getPackageInfo(projectName)
    utils.createProject(packageInfo)
  })

program.parse(process.argv)
