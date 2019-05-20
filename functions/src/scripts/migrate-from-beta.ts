// import { statSync } from 'fs'
// import { copyFileSync, copySync } from 'fs-extra'
// import { homedir } from 'os'
// import { ulid } from 'ulid'
// import { createPageDoc } from '../../src/models/page'
// import { sig } from '../utils'
// import {
//     configFilePath,
//     dataDirectory,
//     Directory,
//     File,
//     pagesDirectory,
//     pagesMainDirectory,
//     resourcesDirectory,
// } from '../utils/file'
// import { VJsdom } from './../core/VJsdom'

// function exists(dirname: string) {
//     try {
//         statSync(dirname)
//         return true
//     } catch (error) {
//         return false
//     }
// }

// async function saveAsV1Page(file: ReturnType<typeof File>) {
//     const html = await file.readAsText()
//     const dom = new VJsdom(html)

//     if (!dom.metadata) {
//         return
//     }

//     const { url, _createdAt } = dom.metadata
//     const _id = ulid()
//     const filename = `${_id}.html`

//     await pagesMainDirectory.file(filename).write(html)

//     return await createPageDoc({
//         _id,
//         url,
//         html,
//         filename,
//         createdAt: _createdAt.toUTC(),
//     })
// }

// async function main() {
//     const oldDataDirectory = Directory(homedir()).subdir('.vanilla-clipper')

//     sig.info('Old data directory: %s', oldDataDirectory.path)
//     sig.info('New data directory: %s', dataDirectory.path)

//     if (exists(pagesDirectory.path) || exists(resourcesDirectory.path)) {
//         sig.error('"pages" or "resources" directory already exists in new data directory.')
//         return
//     }

//     copyFileSync(oldDataDirectory.file('config.js').path, configFilePath)
//     copySync(oldDataDirectory.subdir('resources').path, resourcesDirectory.path)

//     const subdirsInOldPagesDir = oldDataDirectory.subdir('pages').dirList()

//     await Promise.all(
//         subdirsInOldPagesDir.map(subdir => Promise.all(subdir.fileList().map(saveAsV1Page))),
//     )
// }
// main().then(() => process.exit())
