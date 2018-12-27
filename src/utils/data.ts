import { Rarray } from '@yarnaimo/rain'
import { resolve } from 'url'
import { commentOutError, got } from '.'
import { DataListItem, StyleSheetData } from '../types'
import { cssURLPattern, optimizeCSS } from './css'
import { getVAttrSelector } from './element'

export const dataURLPattern = /^data:[\w\/\+]+(?:;.*)?,/

export async function extractOrFetchCSS(sheetDataList: StyleSheetData[], currentURL: string) {
    const sheets = await Rarray.waitAll(sheetDataList, async data => {
        try {
            if (data.type === 'error') throw data.error

            if (data.type === 'text') return optimizeCSS(data.text, currentURL)

            const { body } = await got.get(data.link)
            return optimizeCSS(body, data.link)
        } catch (_error) {
            return { text: commentOutError(_error), urls: new Set<string>() }
        }
    })

    return sheets.reduce(
        ({ texts, urls }, sheet) => {
            return { texts: [...texts, sheet.text], urls: new Set([...urls, ...sheet.urls]) }
        },
        { texts: [] as string[], urls: new Set<string>() }
    )
}

export async function dataSourceURLsToDataList(dataSourceURLs: Set<string>[], currentURL: string) {
    const urls = dataSourceURLs.reduce((prev, current) => [...prev, ...current], [] as string[])

    return Rarray.waitAll<string, DataListItem>(urls, async url => {
        const dataURL = await getDataURL(url, currentURL)
        return [url, dataURL]
    })
}

export function dataListToScriptString(dataList: DataListItem[], cssTexts: string[]) {
    return `{
        const dataMap = new Map(${JSON.stringify(dataList)})

        const styleElements = ${JSON.stringify(cssTexts)}
            .map(text =>
                text.replace(
                    ${cssURLPattern.toString()},
                    (_, prefix, url) => \`\${prefix}('\${dataMap.get(url)}')\`
                )
            )
            .map(text => {
                const el = document.createElement('style')
                el.dataset.vanillaClipperStyle = ''
                el.innerHTML = text
                return el
            })

        document.head.append(...styleElements)

        document.addEventListener('DOMContentLoaded', () => {
            const elements = document.querySelectorAll('${getVAttrSelector.src()}, ${getVAttrSelector.href()}')
            elements.forEach(el => {
                const { vanillaClipperSrc, vanillaClipperHref } = el.dataset
                const src = dataMap.get(vanillaClipperSrc)
                const href = dataMap.get(vanillaClipperHref)

                if (src) el.setAttribute('src', src)
                if (href) el.setAttribute('href', href)
            })
        })
    }`
}

export async function getDataURL(url: string, currentURL: string) {
    try {
        const {
            body,
            headers: { 'content-type': mimetype },
        } = await got.get(currentURL ? resolve(currentURL, url) : url, { encoding: null })

        return `data:${mimetype};base64,${body.toString('base64')}`
    } catch (error) {
        return `data:text/css,${commentOutError(error)}`
    }
}
