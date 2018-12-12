import { Rarray, Rstring } from '@yarnaimo/rain'
import { resolve } from 'url'
import { DataListItem, StyleSheetData } from './types'
import { commentOutError, got } from './utils'

export const convert = {
    async sheetDataListToTexts(sheetDataList: StyleSheetData[], currentURL: string) {
        return Rarray.waitAll(sheetDataList, async ({ link, text, error }) => {
            try {
                if (error) throw error

                let originalText: string
                if (text) {
                    originalText = text
                } else {
                    const { body } = await got.get(link!)
                    originalText = body
                }

                const urlRegExp = /([:,\s]\s*url)\s*\((?!\s*['"]?data:.+,)\s*['"]?(\S+?)['"]?\s*\)/gi

                const urls = [
                    ...new Set(Rstring.globalMatch(originalText, urlRegExp).map(match => match[2])),
                ]
                const dataURLMap = new Map(
                    await Rarray.waitAll(urls, async url => {
                        const dataURL = await convert.urlToDataURL(url, currentURL)
                        return [url, dataURL] as [string, string]
                    })
                )

                return originalText.replace(
                    urlRegExp,
                    (_, prefix, url) => `${prefix}('${dataURLMap.get(url)!}')`
                )
            } catch (_error) {
                return commentOutError(_error)
            }
        })
    },

    async dataSourceUrlsToDataList(dataSourceUrls: string[]) {
        return Rarray.waitAll<string, DataListItem>(dataSourceUrls, async url => {
            const dataURL = await convert.urlToDataURL(url)
            return [url, dataURL]
        })
    },

    dataListToScriptString(dataList: DataListItem[]) {
        return `{
            document.addEventListener('DOMContentLoaded', () => {
                const dataMap = new Map(${JSON.stringify(dataList)})

                const elements = document.querySelectorAll('[data-vanilla-clipper-src], [data-vanilla-clipper-href]')
                elements.forEach(el => {
                    const { vanillaClipperSrc, vanillaClipperHref } = el.dataset
                    const src = dataMap.get(vanillaClipperSrc)
                    const href = dataMap.get(vanillaClipperHref)

                    if (src) el.setAttribute('src', src)
                    if (href) el.setAttribute('href', href)
                })
            })
        }`
    },

    async urlToDataURL(url: string, currentURL?: string) {
        try {
            const {
                body,
                headers: { 'content-type': mimetype },
            } = await got.get(currentURL ? resolve(currentURL, url) : url, { encoding: null })

            return `data:${mimetype};base64,${body.toString('base64')}`
        } catch (error) {
            return `data:text/css,${commentOutError(error)}`
        }
    },
}
