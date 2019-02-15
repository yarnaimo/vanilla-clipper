import { createHash } from 'crypto'
import { readdir, statSync } from 'fs-extra'
import { DateTime } from 'luxon'
import { homedir } from 'os'
import { resolve } from 'path'
import { filenamifyUrl } from '..'
import { IMetadata } from '../types'

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

    const regex = new RegExp(`${basename}-(\\d+)\\.${ext}`)
    const numbers = fileList
        .map(name => name.match(regex))
        .filter((m): m is RegExpMatchArray => !!m)
        .map(m => parseInt(m[1]))

    const number = Math.max(0, ...numbers) + 1
    return resolve(directory, `${basename}-${number}.${ext}`)
}

export function outputPathFn(directory: string) {
    const outputDir = dataPath('pages', directory)
    const dateString = DateTime.local().toFormat('yyyyMMdd')

    return async (metadata: IMetadata) => {
        const basename = `${dateString}-${filenamifyUrl(metadata.url)}`
        const outputPath = await newFilePath(outputDir, basename)
        return outputPath
    }
}

const dataDirectoryName = '.vanilla-clipper'
export const dataDirectoryInHome = resolve(homedir(), dataDirectoryName)

export const dataDirectoryPath = (() => {
    if (process.env.NODE_ENV === 'test') {
        return resolve('tmp', '__data__')
    }

    const inCurrent = resolve(process.cwd(), dataDirectoryName)
    try {
        return statSync(inCurrent).isDirectory() ? inCurrent : dataDirectoryInHome
    } catch (error) {
        return dataDirectoryInHome
    }
})()

export function dataPath(...pathSegments: string[]) {
    return resolve(dataDirectoryPath, ...pathSegments)
}

export function getHash(buffer: Buffer) {
    const hash = createHash('sha256')
    hash.update(buffer)
    return hash.digest('hex')
}
