#!/usr/bin/env ts-node

import { spawnSync } from 'child_process'
import { dbDirectory } from '../utils/file'

spawnSync('pouchdb-server', ['-d', dbDirectory.path, ...process.argv.slice(2)], {
    stdio: 'inherit',
})

process.exit(0)
