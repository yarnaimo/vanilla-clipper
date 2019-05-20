import { EmulateOptions } from 'puppeteer'

export const devices = require('puppeteer/DeviceDescriptors') as {
    [name: string]: EmulateOptions | undefined
}
