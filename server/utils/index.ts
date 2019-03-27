import { is } from '@yarnaimo/rain'
import * as chromeFinder from 'chrome-launcher/dist/chrome-finder'
import { getPlatform } from 'chrome-launcher/dist/utils'
import got from 'got'
import { DateTime } from 'luxon'
import { EmulateOptions } from 'puppeteer'
import * as sig from 'signale'
export { got, sig }
export { filenamifyUrl, devices }

const filenamifyUrl = require('filenamify-url') as (url: string, options?: any) => string

const devices = require('puppeteer-core/DeviceDescriptors') as {
    [name: string]: EmulateOptions | undefined
}

export const noSandboxArgs = ['--no-sandbox', '--disable-setuid-sandbox']

let chromePath: string

export const findChrome = () => {
    if (!chromePath) {
        try {
            const platform = getPlatform()
            const [path] = chromeFinder[platform as 'darwin' | 'linux' | 'win32' | 'wsl']()
            if (!is.string(path)) {
                throw new Error()
            }

            chromePath = path
        } catch (error) {
            throw new Error(
                'Could not find a Chrome installation. If you have already installed Chrome, set the CHROME_PATH environment variable.',
            )
        }
    }
    return chromePath
}

export const now = () => DateTime.utc().toISO()

export const commentOutError = (error: Error) => `/* ${error.toString()} */`
