import { tryCatch2v } from 'fp-ts/lib/Either'
import { copyFileSync, statSync } from 'fs'
import { mkdirpSync } from 'fs-extra'
import { resolve } from 'path'
import { configFilePath, dataDirectory, pouchdbConfigFilePath } from '../utils/file'

mkdirpSync(dataDirectory.path)

tryCatch2v(() => statSync(configFilePath), () => copyFileSync(resolve('config.js'), configFilePath))

tryCatch2v(
    () => statSync(pouchdbConfigFilePath),
    () => copyFileSync(resolve('pouchdb-config.json'), pouchdbConfigFilePath),
)
