import got from 'got'
import * as sig from 'signale'
import { VMetadata } from './core/VMetadata'
export { sig }
export { filenamifyUrl }

export interface DataMap {
    [url: string]: string
}

export type DataItem = [string, string]

const filenamifyUrl = require('filenamify-url') as (url: string, options?: any) => string

export const noSandboxArgs = ['--no-sandbox', '--disable-setuid-sandbox']

export const commentOutError = (error: Error | string) => `/* ${error.toString()} */`

export const generateFullHTML = (doctype: string, html: string, vMetadata: VMetadata) => {
    return `${doctype}
<!--Clipped with @yarnaimo/vanilla-->
<!--vanilla-metadata: ${vMetadata.stringify()}-->
${html}`
}

export const extractVanillaMetadata = (fullHTML: string) => {
    const m = fullHTML.match(/^<!--vanilla-metadata: ({\n[\s\S]+?\n})-->/)
    if (!m) return null

    return m && m[1]
}

export const generateScriptString = (dataList: DataItem[]) => {
    return `{
        document.addEventListener('DOMContentLoaded', () => {
            const dataMap = new Map(${JSON.stringify(dataList)})

            const elements = document.querySelectorAll('[data-vanilla-src], [data-vanilla-href]')
            elements.forEach(el => {
                const { vanillaSrc, vanillaHref } = el.dataset
                const src = dataMap.get(vanillaSrc)
                const href = dataMap.get(vanillaHref)

                if (src) el.setAttribute('src', src)
                if (href) el.setAttribute('href', href)
            })
        })
    }`
}

export const getAsDataURL = async (url: string) => {
    const {
        body,
        headers: { 'content-type': mimetype },
    } = await got.get(url, { encoding: null })

    return `data:${mimetype};base64,${body.toString('base64')}`
}
