import { Rarray } from '@yarnaimo/rain'
import { get } from 'got'
import { ElementHandle, EvaluateFn, Page } from 'puppeteer'
import { getDomain } from 'tldjs'
import {
    commentOutError,
    DataItem,
    generateFullHTML,
    generateScriptString,
    getAsDataURL,
} from '../utils'
import { Handler } from './Handler'
import { VMetadata } from './VMetadata'

export class VPage {
    static async create(page: Page, clone = true) {
        const vPage = new this(page)
        vPage.originalHandle = await vPage.evaluateHandleAsElement(() => document)

        if (clone) {
            vPage.clonedHandle = await vPage.evaluateHandleAsElement(() => document.cloneNode(true))
        }
        return vPage
    }

    originalHandle!: ElementHandle<Element>

    clonedHandle!: ElementHandle<Element>

    private constructor(public page: Page) {}

    private async evaluateHandleAsElement(fn: EvaluateFn) {
        const handle = await this.page.evaluateHandle(fn)
        return handle.asElement()!
    }

    async close() {
        return this.page.close()
    }

    async eval<T, A extends any[]>(
        cloned: boolean,
        fn: (document: Document, ...args: A) => T,
        ...args: A
    ) {
        const result = await this.page.evaluate(
            fn as any,
            cloned ? this.clonedHandle : this.originalHandle,
            ...args
        )
        return result as T
    }

    async clip() {
        const styleSheets = await this.eval(false, Handler.getStyleSheets)
        const cssTexts = await Rarray.waitAll(styleSheets, async ({ link, text, error }) => {
            if (error) return commentOutError(error)
            if (text) return text

            const { body } = await get(link!).catch(error => ({ body: commentOutError(error) }))
            return body
        })

        await this.eval(true, Handler.clean)
        await this.eval(true, Handler.reallocateCSS, cssTexts)

        const dataListUrls = await this.eval(true, Handler.data)
        const dataList = await Rarray.waitAll(dataListUrls, async url => {
            try {
                const dataURL = await getAsDataURL(url)
                return [url, dataURL] as DataItem
            } catch (error) {
                return [url, ''] as DataItem
            }
        })

        await this.eval(true, Handler.appendScript, generateScriptString(dataList))

        const doctype = await this.eval(true, d =>
            new XMLSerializer().serializeToString(d.doctype!)
        )
        const html = await this.eval(true, d => d.documentElement!.outerHTML)
        const location = await this.eval(true, d => document.location!)
        const title = await this.eval(true, d => d.title)

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
