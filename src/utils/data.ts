import { Rarray } from '@yarnaimo/rain'
import { resolve } from 'url'
import { commentOutError, got } from '.'
import { DataListItem, StyleSheetData } from '../types'
import { cssURLPattern, replaceRelativeURLsInCSS } from './css'
import { getVAttrSelector } from './element'

export const dataURLPattern = /^data:[\w\/\+]+(?:;.*)?,/

export async function extractOrFetchCSS(sheetDataList: StyleSheetData[]) {
    const sheets = await Rarray.waitAll(sheetDataList, async data => {
        try {
            if (data.type === 'error') throw data.error

            if (data.type === 'text') return replaceRelativeURLsInCSS(data.text, data.url)

            const { body } = await got.get(data.url)
            return replaceRelativeURLsInCSS(body, data.url)
        } catch (_error) {
            return commentOutError(_error)
        }
    })
    return sheets
}

export async function dataSourceURLsToDataList(dataSourceURLs: Set<string>[], currentURL: string) {
    const urls = dataSourceURLs.reduce((prev, current) => [...prev, ...current], [] as string[])

    return Rarray.waitAll<string, DataListItem>(urls, async url => {
        const dataURL = await getDataURL(url, currentURL)
        return [url, dataURL]
    })
}

export function dataListToScriptString(dataList: DataListItem[], cssTexts: string[]) {
    const dataElementSelector = `${getVAttrSelector.src()}, ${getVAttrSelector.href()}`
    const videoElementSelector = `${getVAttrSelector.video()}`
    const _cssURLPattern = cssURLPattern

    async function main() {
        const objectURLMap = new Map(
            await Promise.all(
                dataList.map(async ([url, dataURL]) => {
                    const blob = await fetch(dataURL).then(res => res.blob())
                    return [url, URL.createObjectURL(blob)] as [string, string]
                })
            )
        )

        const styleElements = cssTexts
            .map(text =>
                text.replace(
                    _cssURLPattern,
                    (_, prefix, url) => `${prefix}('${objectURLMap.get(url)}')`
                )
            )
            .map(text => {
                const el = document.createElement('style')
                el.dataset.vanillaClipperStyle = ''
                el.innerHTML = text
                return el
            })

        document.head.append(...styleElements)

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onload)
        } else {
            onload()
        }

        function onload() {
            const dataElements = document.querySelectorAll<HTMLElement>(dataElementSelector)

            dataElements.forEach(el => {
                const { vanillaClipperSrc, vanillaClipperHref } = el.dataset
                const src = objectURLMap.get(vanillaClipperSrc!)
                const href = objectURLMap.get(vanillaClipperHref!)

                if (src) el.setAttribute('src', src)
                if (href) el.setAttribute('href', href)
            })

            const videoElement = document.querySelector<HTMLVideoElement>(videoElementSelector)

            if (videoElement) {
                const playOrPause = () =>
                    videoElement.paused ? videoElement.play() : videoElement.pause()

                videoElement.onclick = playOrPause

                document.body.onkeypress = () => {
                    if ((window.event as KeyboardEvent).keyCode === 32) {
                        ;(window.event as KeyboardEvent).preventDefault()
                        playOrPause()
                    }
                }
            }
        }
    }

    return `
        const _cssURLPattern = ${_cssURLPattern.toString()}
        const dataList = ${JSON.stringify(dataList)}
        const cssTexts = ${JSON.stringify(cssTexts)}
        const dataElementSelector = '${dataElementSelector}'
        const videoElementSelector = '${videoElementSelector}'

        ${main.toString()}
        main()
    `
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
