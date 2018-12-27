import { Rarray } from '@yarnaimo/rain'
import { JSDOM } from 'jsdom'
import { Frame, Page } from 'puppeteer-core'
import { getDomain } from 'tldjs'
import { jsdomPlugins } from '../plugins'
import { dataListToScriptString, dataSourceURLsToDataList, extractOrFetchCSS } from '../utils/data'
import {
    appendScriptToHead,
    embedIFrameContents,
    moveAttrToDatasetAndReturnURLs,
} from '../utils/document'
import { createElementFinder, getVAttrSelector } from '../utils/element'
import { generateFullHTML } from '../utils/html'
import { VDocument } from './VDocument'
import { VMetadata } from './VMetadata'

export class VFrame {
    isRoot = false

    constructor(public frame: Frame | Page) {}

    async clip({ minify = true, selector = undefined as string | undefined } = {}) {
        const originalDocument = await VDocument.create(this, () => document)
        await originalDocument.setUuidToIFrames()

        const { doctype, html: originalHTML, title, location } = await originalDocument.eval(d => ({
            doctype: d.doctype ? new XMLSerializer().serializeToString(d.doctype) : undefined,
            html: d.documentElement.outerHTML,
            title: d.title,
            location: d.location,
        }))
        const sheetDataList = await originalDocument.getSheetDataList()

        const { window } = new JSDOM(originalHTML, { url: location.href })
        const finder = createElementFinder(window.document)

        if (selector) {
            const el = window.document.body.querySelector(selector)
            if (el) window.document.body.innerHTML = el.outerHTML
        }
        jsdomPlugins.exec(window.document)

        await Promise.all([
            (async () => {
                const iframes = finder(getVAttrSelector.iframeUuid())
                const iframeUuidsToClip = iframes.map(el => el.dataset.vanillaClipperIframeUuid!)

                const iframeDataList = await Rarray.waitAll(iframeUuidsToClip, async uuid => {
                    try {
                        const handle = await originalDocument.$(getVAttrSelector.iframeUuid(uuid))

                        const frame = await handle!.contentFrame()
                        const vFrame = new VFrame(frame!)
                        const { html } = await vFrame.clip()
                        return { uuid, html }
                    } catch (error) {
                        return { uuid, html: '' }
                    }
                })

                embedIFrameContents(finder, iframeDataList)
            })(),

            (async () => {
                const urlsInAttrs = moveAttrToDatasetAndReturnURLs(finder)

                const sheets = await extractOrFetchCSS(sheetDataList, location.href)

                const dataList = await dataSourceURLsToDataList(
                    [sheets.urls, urlsInAttrs],
                    location.href
                )

                const scriptString = dataListToScriptString(dataList, sheets.texts)
                appendScriptToHead(window.document, scriptString)
            })(),
        ])

        let vMetadata: VMetadata | undefined

        if (this.isRoot) {
            vMetadata = new VMetadata()
            vMetadata.set({
                domain: getDomain(location.href) || location.hostname,
                hostname: location.hostname,
                url: location.href,
                title,
            })
            await vMetadata.validate()
        }

        return {
            html: generateFullHTML({
                doctype,
                html: window.document.documentElement.outerHTML,
                vMetadata,
                minify,
            }),
            metadata: vMetadata,
        }
    }
}
