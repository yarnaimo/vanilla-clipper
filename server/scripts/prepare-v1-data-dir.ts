import { copyFileSync, statSync } from 'fs'
import { mkdirpSync } from 'fs-extra'
import { resolve } from 'path'
import { configFilePath, dataDirectory } from '../utils/file'

mkdirpSync(dataDirectory.path)

try {
    statSync(configFilePath)
} catch (error) {
    copyFileSync(resolve('config.js'), configFilePath)
}
