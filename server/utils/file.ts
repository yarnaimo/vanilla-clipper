import getAppDataPath from 'appdata-path'
import { createHash } from 'crypto'
import { outputFile, readdir, readdirSync, readFile, statSync } from 'fs-extra'
import { resolve } from 'path'

export const dataURLPattern = /^data:([\w\/\+]+)(?:;.*)?,(.*)$/

export function dataURLToBuffer(dataURL: string) {
    const m = dataURLPattern.exec(dataURL)
    if (!m) {
        return
    }

    return { buffer: Buffer.from(m[2], 'base64'), mimetype: m[1] || undefined }
}

export function extractExtensionFromURL(url: string) {
    const m = url.match(/['"]?[^?#]+\.(\w+)(?:['"]?$|\?|#)/)
    return m ? m[1] : null
}

export async function newFilePath(directory: string, basename: string, ext = 'html') {
    const fileList = await readdir(directory).catch(() => [] as string[])

    if (!fileList.includes(`${basename}.${ext}`)) {
        return resolve(directory, `${basename}.${ext}`)
    }

    const regex = new RegExp(`-(\\d+)\\.${ext}`)
    const numbers = fileList
        .map(name => name.startsWith(`${basename}-`) && name.match(regex))
        .filter((m): m is RegExpMatchArray => !!m)
        .map(m => parseInt(m[1]))

    const number = Math.max(0, ...numbers) + 1
    return resolve(directory, `${basename}-${number}.${ext}`)
}

export const dataDirectoryPath =
    process.env.NODE_ENV === 'test' ? resolve('tmp', '__data__') : getAppDataPath('vanilla-clipper')

export function dataPath(...pathSegments: string[]) {
    return resolve(dataDirectoryPath, ...pathSegments)
}

export const File = (path: string) => {
    return {
        path,

        async write(data: string | Buffer) {
            return outputFile(path, data)
        },

        async readAsText() {
            return readFile(path, 'utf8')
        },
    }
}

export const Directory = (path: string) => {
    return {
        path,

        childPath(name: string) {
            return resolve(path, name)
        },

        subdir(dirname: string) {
            return Directory(this.childPath(dirname))
        },

        file(name: string) {
            return File(this.childPath(name))
        },

        getChildren() {
            return readdirSync(path).map(this.childPath)
        },

        stat(name: string) {
            return statSync(this.childPath(name))
        },

        fileList() {
            return this.getChildren()
                .filter(path => this.stat(path).isFile())
                .map(File)
        },

        dirList() {
            return this.getChildren()
                .filter(path => this.stat(path).isDirectory())
                .map(Directory)
        },
    }
}

export const dataDirectory = Directory(dataDirectoryPath)
export const dbDirectory = dataDirectory.subdir('db')
export const pagesDirectory = dataDirectory.subdir('pages')
export const pagesMainDirectory = pagesDirectory.subdir('main')
export const resourcesDirectory = dataDirectory.subdir('resources')
export const configFilePath = dataDirectory.childPath('config.js')

export function getHash(buffer: Buffer) {
    const hash = createHash('sha256')
    hash.update(buffer)
    return hash.digest('hex')
}
