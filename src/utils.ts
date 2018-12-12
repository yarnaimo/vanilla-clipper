import { isNot } from '@yarnaimo/rain'
import * as chromeFinder from 'chrome-launcher/dist/chrome-finder'
import { getPlatform } from 'chrome-launcher/dist/utils'
import got from 'got'
import * as sig from 'signale'
import { VMetadata } from './core/VMetadata'
export { got, sig, filenamifyUrl }
const filenamifyUrl = require('filenamify-url') as (url: string, options?: any) => string

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

export const generateFullHTML = (doctype: string, html: string, vMetadata: VMetadata) => {
    return `${doctype}
<!--Clipped with vanilla-clipper-->
<!--vanilla-clipper-metadata: ${vMetadata.stringify()}-->
${html}`
}

export const extractVanillaMetadata = (fullHTML: string) => {
    const m = fullHTML.match(/^<!--vanilla-clipper-metadata: ({\n[\s\S]+?\n})-->/)
    if (!m) return null

    return m && m[1]
}
