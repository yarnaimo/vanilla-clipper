const os = require('os')
const fs = require('fs-extra')
const path = require('path')

const dataDirectoryName = '.vanilla-clipper'
const dataDirectoryInHome = path.resolve(os.homedir(), dataDirectoryName)

fs.mkdirpSync(dataDirectoryInHome)
const configPath = path.resolve(dataDirectoryInHome, 'config.js')

try {
    fs.statSync(configPath)
} catch (error) {
    fs.copyFileSync(path.resolve('config.js'), configPath)
}
