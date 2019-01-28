import { isNot } from '@yarnaimo/rain'
import * as chromeFinder from 'chrome-launcher/dist/chrome-finder'
import { getPlatform } from 'chrome-launcher/dist/utils'
import { readdir } from 'fs-extra'
import got from 'got'
import { resolve } from 'path'
import * as sig from 'signale'
export { got, sig }

export const noSandboxArgs = ['--no-sandbox', '--disable-setuid-sandbox']

let chromePath: string

export const findChrome = () => {
    if (!chromePath) {
        try {
            const platform = getPlatform()
            const [path] = chromeFinder[platform as 'darwin' | 'linux' | 'win32' | 'wsl']()
            if (isNot.string(path)) throw new Error()

            chromePath = path
        } catch (error) {
            throw new Error(
                'Could not find a Chrome installation. If you have already installed Chrome, set the CHROME_PATH environment variable.'
            )
        }
    }
    return chromePath
}

export const commentOutError = (error: Error) => `/* ${error.toString()} */`

export function extractExtensionFromURL(url: string) {
    const m = url.match(/[^?#]+\.(\w+)(?:$|\?|#)/)
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
