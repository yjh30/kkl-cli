const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const program = require('commander')
const inquirer = require('inquirer')
const ora = require('ora')
const chalk = require('chalk')
const handlebars = require('handlebars')
const { exec, execSync } = require('child_process')

exports.confirmIsGenerate = function(projectName) {
  let message = ''
  const projectPath = path.resolve(process.cwd(), projectName)

  if (fs.existsSync(projectPath) && fs.statSync(projectPath).isDirectory()) {
    message = 'Target directory exists. Continue?'
  }
  if (!message) {
    return Promise.resolve(true)
  }

  return new Promise(resolve => {
    inquirer
      .prompt([
        {
          type: 'confirm',
          name: 'isGenerate',
          default: true,
          message
        }
      ])
      .then(answers => {
        if (answers['isGenerate']) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
  })
}

exports.getPackageInfo = function(projectName) {
  let userInfo = ''
  try {
    const userName = execSync('git config user.name', { encoding: 'utf8' }).trim()
    const userEmail = execSync('git config user.email', { encoding: 'utf8' }).trim()
    userInfo = `${userName} \<${userEmail}\>`
  } catch (error) {}

  return new Promise(resolve => {
    inquirer
      .prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name',
          default: projectName
        },
        {
          type: 'input',
          name: 'description',
          message: 'Project description',
          default: 'A Vue.js component project'
        },
        {
          type: 'input',
          name: 'author',
          message: 'Author',
          default: userInfo
        }
      ])
      .then(answers => {
        const { projectName, description, author } = answers
        resolve({
          name: projectName,
          description,
          author
        })
      })
  })
}

exports.createProject = function(packageInfo) {
  const { name } = packageInfo
  const spinner = ora('downloading template').start()

  try {
    shell.rm('-rf', path.resolve(process.cwd(), name))
  } catch (error) {
     //... 
  }

  exec(`git clone https://github.com/yjh30/vue-ssr-component-tpl.git ${name}`, (error, stdout, stderr) => {
    if (error) {
      console.log(chalk.red(`downloading template fail ${error}`))
      spinner.stop()
      return
    }

    spinner.succeed('downloading template succeed')

    const packageFileName = `${name}/package.json`
    const packageJson = fs.readFileSync(packageFileName).toString()
    fs.writeFileSync(packageFileName, handlebars.compile(packageJson)(packageInfo))

    try {
      shell.rm('-rf', path.resolve(process.cwd(), `${name}/.git`))
    } catch (error) {
       //... 
    }

    console.log(`
# ${chalk.green('Project initialization finished!')}\n
# ========================\n
To get started:\n${chalk.yellow(`cd ${name}\nnpm install (or if using yarn: yarn)\nnpm run dev\n`)}
    `)
  })
}
