import { Frame, Page } from 'puppeteer-core'
import { getDomain } from 'tldjs'
import { VBrowser } from '..'
import { optimizeCSS } from '../utils/css'
import { dataListToScriptString, dataSourceURLsToDataList, extractOrFetchCSS } from '../utils/data'
import { generateFullHTML } from '../utils/html'
import { VDocument } from './VDocument'
import { VJsdom } from './VJsdom'
import { VMetadata } from './VMetadata'
import { VPage } from './VPage'

interface ClipOption {
    minify?: boolean
    element?: string
    click?: string
    scroll?: string
    maxScrolls?: number
    vMetadata?: VMetadata
}

export class VFrame {
    isRoot = false

    constructor(public vBrowser: VBrowser, public frame: Frame | Page) {}

    async clip({
        minify = true,
        element,
        click,
        scroll,
        maxScrolls = 10,
        vMetadata,
    }: ClipOption = {}) {
        const originalDocument = await VDocument.create(this, () => document)

        const height = await originalDocument.scrollToBottom({ element, scroll, maxScrolls })

        if (this instanceof VPage) {
            await this.setViewportHeight(height)
            await this.frame.waitFor(3000)
        }

        if (click) await originalDocument.click(click)

        await originalDocument.setUuidToIFrames()

        const {
            doctype,
            html: originalHTML,
            title,
            location,
        } = await originalDocument.getMetadata()

        const sheetDataList = await originalDocument.getSheetDataList()

        const dom = new VJsdom(originalHTML, { url: location.href })

        if (element) {
            dom.setElementAsRoot(element)
        }
        dom.execPlugins()

        const m = location.href.match(/https:\/\/mobile\.twitter\.com\/.+\/status\/(\d+)/)
        if (m) {
            await dom.embedTwitterVideo(m[1])
        }

        await Promise.all([
            (async () => {
                const iframes = dom.getIframes()
                const iframeDataList = await originalDocument.clipIframes(iframes)

                dom.embedIFrameContents(iframeDataList)
            })(),

            (async () => {
                const urlsInAttrs = dom.moveAttrToDatasetAndReturnURLs()

                const cssTexts = await extractOrFetchCSS(sheetDataList)
                const optimized = cssTexts.map(text => optimizeCSS(text, dom.document))

                const joined = optimized.reduce(
                    ({ texts, urls }, sheet) => {
                        return {
                            texts: [...texts, sheet.text],
                            urls: new Set([...urls, ...sheet.urls]),
                        }
                    },
                    { texts: [] as string[], urls: new Set<string>() }
                )

                const dataList = await dataSourceURLsToDataList(
                    [joined.urls, urlsInAttrs],
                    location.href
                )

                const scriptString = dataListToScriptString(dataList, joined.texts)
                dom.appendScriptToHead(scriptString)
            })(),
        ])

        if (this instanceof VPage) {
            await this.resetViewport()
        }

        if (this.isRoot) {
            if (!vMetadata) {
                vMetadata = new VMetadata()
                vMetadata.set({
                    domain: getDomain(location.href) || location.hostname,
                    hostname: location.hostname,
                    url: location.href,
                    title,
                })
            }
            await vMetadata.validate()
        }

        return {
            html: generateFullHTML({
                doctype,
                document: dom.document,
                vMetadata,
                minify,
            }),
            metadata: vMetadata,
        }
    }
}
