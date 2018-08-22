const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const program = require('commander')
const inquirer = require('inquirer')
const ora = require('ora')
const chalk = require('chalk')
const handlebars = require('handlebars')
const { exec, execSync } = require('child_process')

module.exports = {
  async init(projectName) {
    const isGenerate = await this.confirmIsGenerate(projectName)
    if (!isGenerate) { return }

    const packageInfo = await this.collectPackageInfo(projectName)
    const { dirname } = packageInfo
    const spinner = ora('downloading template').start()

    try {
      shell.rm('-rf', path.resolve(process.cwd(), dirname))
    } catch (error) {
       //... 
    }

    const downloadPromise = this.downloadTemplate(packageInfo)

    downloadPromise.catch(error => {
      console.log(chalk.red(`\ndownloading template fail ${error}`))
      spinner.stop()
    })

    await downloadPromise
    spinner.succeed('downloading template succeed')

    this.updatePackageJson(packageInfo)
    this.updateReadme(packageInfo)
    this.gitInit(packageInfo)

    const isInstall = await this.confirmIsInstallPackage()
    if (!isInstall) {
      return this.successHandler(dirname)
    }
    this.installPackage(dirname)
  },

  /**
   * confirmIsGenerate 确定是否生成项目
   * @param  {String} projectName 用户输入的项目名称
   * @return {Promise}
   */
  confirmIsGenerate(projectName) {
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
  },

  /**
   * collectPackageInfo 收集包字段信息
   * @param  {String} projectName 用户输入的项目名称
   * @return {Promise}
   */
  collectPackageInfo(projectName) {
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
          },
          {
            type: 'input',
            name: 'repositoryUrl',
            message: 'repository url',
            default: ''
          }
        ])
        .then(answers => {
          const { projectName, description, author, repositoryUrl } = answers
          resolve({
            dirname: projectName,
            name: projectName.replace(/^kkl-?/i, ''),
            description,
            author,
            repository: {
              url: repositoryUrl
            }
          })
        })
    })
  },

  /**
   * downloadTemplate 下载组件模版
   * @param  {Object} packageInfo 包信息
   * @return {Promise}
   */
  downloadTemplate(packageInfo) {
    return new Promise((resolve, reject) => {
      exec(`git clone https://github.com/yjh30/vue-ssr-component-tpl.git ${packageInfo.dirname}`, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  },

  /**
   * updatePackageJson 更新package.json文件
   * @param  {Object} packageInfo 包信息
   * @return {undefined}
   */
  updatePackageJson(packageInfo) {
    const packageFileName = `${packageInfo.dirname}/package.json`
    const packageJson = fs.readFileSync(packageFileName).toString()
    fs.writeFileSync(packageFileName, handlebars.compile(packageJson)(packageInfo))
  },

  /**
   * updateReadme 更新README.md文档
   * @param  {Object} packageInfo 包信息
   * @return {undefined}
   */
  updateReadme(packageInfo) {
    const { dirname, name } = packageInfo
    const readmePath = path.resolve(process.cwd(), `${dirname}/README.md`)
    if (fs.existsSync(readmePath)) {
      shell.rm('-rf', readmePath)
    }

    const context = `
  # @kkl/${name}
  > 用一句话概况组件（如：vue移动端h5 水平滑屏手势交互组件）
  ### 安装
  \`\`\` bash
  npm i -S @kkl/${name}
  \`\`\`
  ### 使用
    `

    fs.writeFileSync(readmePath, context)
  },

  /**
   * gitInit 执行git init，服务于第三方githooks或husky模块
   * @param  {Object} packageInfo 包信息
   * @return {undefined}
   */
  gitInit(packageInfo) {
    const { dirname } = packageInfo
    try {
      shell.rm('-rf', path.resolve(process.cwd(), `${dirname}/.git`))
    } catch (error) {
       //... 
    }

    process.chdir(`${process.cwd()}/${dirname}`)
    execSync('git init')
    process.chdir(path.resolve(process.cwd(), '../'))
  },

  /**
   * confirmIsGenerate 确定是否执行npm install
   * @return {Promise}
   */
  confirmIsInstallPackage() {
    return new Promise(resolve => {
      inquirer
        .prompt([
          {
            type: 'confirm',
            name: 'isInstallPackage',
            default: true,
            message: 'Should we run `npm install` for you after the project has been created? (recommended) '
          }
        ])
        .then(answers => {
          if (answers['isInstallPackage']) {
            resolve(true)
          } else {
            resolve(false)
          }
        })
    })
  },

  /**
   * installPackage 执行npm install
   * @return {Promise}
   */
  installPackage(dirname) {
    return new Promise(resolve => {
      inquirer
        .prompt([
          {
            name: 'installType',
            type: 'list',
            choices: [
              {
                name: 'Yes, use NPM',
                value: 'npm'
              },
              {
                name: 'Yes, use Yarn',
                value: 'yarn'
              },
              {
                name: 'No, I will handle that myself',
                value: ''
              }
            ],
            default: 'npm'
          }
        ])
        .then(answers => {
          const type = answers['installType']
          if (type === '') {
            return this.successHandler(dirname)
          }
          process.chdir(`${process.cwd()}/${dirname}`)
          shell.exec(`${type} install`, { silent: false })
          process.chdir(path.resolve(process.cwd(), '../'))
          this.successHandler(dirname)
        })
    })
  },

  successHandler(dirname) {
      console.log(`
# ${chalk.green('Project initialization finished!')}\n
# ========================\n
To get started:\n${chalk.yellow(`cd ${dirname}\nnpm install (or if using yarn: yarn)\nnpm run dev\n`)}
      `)
  }
}
