#!/usr/bin/env ts-node

import { spawnSync } from 'child_process'
import { chdir } from 'process'
import { dataDirectoryPath } from '../utils/file'

chdir(dataDirectoryPath)

spawnSync('pouchdb-server', ['-d', 'db', '-c', 'pouchdb-config.json', ...process.argv.slice(2)], {
    stdio: 'inherit',
})

process.exit(0)
