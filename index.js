#!/usr/bin/env node

const program = require('commander')
const inquirer = require('inquirer')
const utils = require('./utils')

program
  .version('1.0.0', '-v, --version')
  .command('init <projectName>')
  .action(async projectName => {
    const isGenerate = await utils.confirmIsGenerate(projectName)
    const packageInfo = await utils.getPackageInfo(projectName)
    utils.createProject(packageInfo)
  })

program.parse(process.argv)
