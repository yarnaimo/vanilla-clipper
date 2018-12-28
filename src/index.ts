import { EmulateOptions } from 'puppeteer'

export { VBrowser } from './core/VBrowser'
export { VFrame } from './core/VFrame'
export { VMetadata } from './core/VMetadata'
export { VPage } from './core/VPage'
export { filenamifyUrl, devices }
const filenamifyUrl = require('filenamify-url') as (url: string, options?: any) => string
const devices = require('puppeteer-core/DeviceDescriptors') as (EmulateOptions | undefined)[]
