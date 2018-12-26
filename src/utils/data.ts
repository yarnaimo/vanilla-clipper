import { Rarray } from '@yarnaimo/rain'
import { resolve } from 'url'
import { commentOutError, got } from '.'
import { DataListItem, StyleSheetData } from '../types'
import { cssURLPattern } from './css'
import { getVAttrSelector } from './element'

export async function extractOrFetchCSSText(sheetDataList: StyleSheetData[]) {
    return await Rarray.waitAll(sheetDataList, async ({ link, text, error }) => {
        try {
            if (error) throw error
            if (text) return text

            const { body } = await got.get(link!)
            return body
        } catch (_error) {
            return commentOutError(_error)
        }
    })
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
