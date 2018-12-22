import { Frame, Page } from 'puppeteer-core'
import { getDomain } from 'tldjs'
import { plugins } from '../plugins'
import {
    dataListToScriptString,
    dataSourceUrlsToDataList,
    extractOrFetchCSSText,
    extractURLsInCSSText,
    generateFullHTML,
    getHTMLStringOfIFrame,
    optimizeCSS,
} from './page-utils'
import { VDocument } from './VDocument'
import { VMetadata } from './VMetadata'

export class VFrame {
    constructor(public frame: Frame | Page, public url: string = 'about:blank') {}

    async clip({ minify = true, isRoot = true } = {}) {
        const originalDocument = await VDocument.create(this, () => document)
        const location = await originalDocument.eval(d => d.location!)
        const sheetDataList = await originalDocument.getSheetDataList()
        await plugins.exec(originalDocument) // clean

        await Promise.all([
            (async () => {
                const iFrameHandles = await originalDocument.getIFrameHandles()

                const vFrameHTMLs = await getHTMLStringOfIFrame(iFrameHandles)
                await originalDocument.setIFramesSrcdoc(vFrameHTMLs, iFrameHandles)
            })(),

            (async () => {
                const cssTexts = await extractOrFetchCSSText(sheetDataList)
                const optimizedCSSTexts = cssTexts.map(optimizeCSS)

                const dataSourceURLs = await Promise.all([
                    originalDocument.getDataSourceURLs(),
                    extractURLsInCSSText(optimizedCSSTexts),
                ])

                const dataList = await dataSourceUrlsToDataList(dataSourceURLs, location.href)
                await originalDocument.appendScript(
                    dataListToScriptString(dataList, optimizedCSSTexts)
                )
            })(),
        ])

        const { doctype, html, title } = await originalDocument.eval(d => ({
            doctype: d.doctype ? new XMLSerializer().serializeToString(d.doctype) : undefined,
            html: d.documentElement!.outerHTML,
            title: d.title,
        }))

        let vMetadata: VMetadata | undefined

        if (isRoot) {
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
            html: generateFullHTML({ doctype, html, vMetadata, minify }),
            metadata: vMetadata,
        }
    }
}
