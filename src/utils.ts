import { isNot } from '@yarnaimo/rain'
import * as chromeFinder from 'chrome-launcher/dist/chrome-finder'
import { getPlatform } from 'chrome-launcher/dist/utils'
import * as css from 'css'
import got from 'got'
import * as sig from 'signale'
export { css, got, sig, filenamifyUrl }
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

export const getBySelectors = (document: Document) => (...selectors: string[]) => [
    ...document.querySelectorAll<HTMLElement>(selectors.join(', ')),
]
