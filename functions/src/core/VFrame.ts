import { t } from 'bluespark'
import { Frame, Page, Viewport } from 'puppeteer'
import { ClipRequest } from '../../../src/models/browserTask'
import { extractOrFetchCSS, optimizeCSS } from '../utils/css'
import { VDocument } from './VDocument'
import { VJsdom } from './VJsdom'

export const VFrame = <F extends Frame | Page, P extends boolean = F extends Page ? true : false>(
    frame: F,
    isPage: P,
) => ({
    frame,

    isPage(frame: Page | Frame): frame is Page {
        frame
        return isPage
    },

    initialViewport: null as Viewport | null,

    setInitialViewport() {
        if (this.isPage(this.frame)) {
            this.initialViewport = this.frame.viewport()
        }
    },

    async setViewportHeight(height: number) {
        if (this.isPage(this.frame)) {
            await this.frame.setViewport({ ...this.initialViewport!, height })
            await this.frame.waitFor(3000)
        }
    },

    async resetViewport() {
        if (this.isPage(this.frame)) {
            await this.frame.setViewport(this.initialViewport!)
        }
    },

    async _clip({
        compact = false,
        element,
        click,
        scroll,
        maxScrolls = 10,
    }: t.TypeOf<typeof ClipRequest>) {
        this.setInitialViewport()

        const originalDocument = await VDocument(this.frame, () => document)

        const height = await originalDocument.scrollToBottom({ element, scroll, maxScrolls })

        this.setViewportHeight(height)

        if (click) {
            await originalDocument.click(click)
        }

        if (!compact) {
            await originalDocument.setUuidToIFramesAndShadowHosts()
            await originalDocument.replaceObjectURLsWithDataURL()
            await originalDocument.embedContentOfShadowDOMs()
        }

        const { html: originalHTML, location } = await originalDocument.getHTML()
        const sheetDataList = await originalDocument.getSheetDataList()

        const dom = new VJsdom(originalHTML, { url: location.href })

        if (element) {
            dom.setElementAsRoot(element)
        }
        dom.execPlugins()

        if (compact) {
            return dom.generate()
        }

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
                await dom.processResourcesInAttrs()

                const sheets = await extractOrFetchCSS(sheetDataList)
                const optimized = await Promise.all(
                    sheets.map(sheet => optimizeCSS(sheet, dom.document)),
                )

                dom.appendStyleSheets(optimized)
                dom.appendScriptToHead()
            })(),
        ])

        await this.resetViewport()

        return dom.generate()
    },
})
