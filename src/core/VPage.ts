import { Page } from 'puppeteer-core'
import { getDomain } from 'tldjs'
import { convert } from '../convert'
import { clonedDocumentPlugins } from '../plugins/clonedDocument'
import { originalDocumentPlugins } from '../plugins/originalDocument'
import { generateFullHTML } from '../utils'
import { VDocument } from './VDocument'
import { VMetadata } from './VMetadata'

export class VPage {
    static async create(page: Page) {
        return new this(page, await VDocument.create(page, () => document))
    }

    public clonedDocument!: VDocument

    private constructor(public page: Page, public originalDocument: VDocument) {}

    async clone() {
        this.clonedDocument = await VDocument.create(this.page, () => document.cloneNode(true))
    }

    async close() {
        return this.page.close()
    }

    async clip() {
        const sheetDataList = await this.originalDocument.getSheetDataList()

        await originalDocumentPlugins.exec(this.originalDocument)
        await this.clone()
        await clonedDocumentPlugins.exec(this.clonedDocument)

        const location = await this.clonedDocument.eval(() => document.location!)

        await Promise.all([
            (async () => {
                const cssTexts = await convert.sheetDataListToTexts(sheetDataList, location.href)
                await this.clonedDocument.reallocateCSS(cssTexts)
            })(),

            (async () => {
                const dataSourceUrls = await this.clonedDocument.data()

                const dataList = await convert.dataSourceUrlsToDataList(dataSourceUrls)
                await this.clonedDocument.appendScript(convert.dataListToScriptString(dataList))
            })(),
        ])

        const { doctype, html, title } = await this.clonedDocument.eval(d => ({
            doctype: new XMLSerializer().serializeToString(d.doctype!),
            html: d.documentElement!.outerHTML,
            title: d.title,
        }))

        const vMetadata = new VMetadata()
        vMetadata.set({
            domain: getDomain(location.href) || location.hostname,
            hostname: location.hostname,
            url: location.href,
            title,
        })
        await vMetadata.validate()

        return { html: generateFullHTML(doctype, html, vMetadata), metadata: vMetadata }
    }
}
