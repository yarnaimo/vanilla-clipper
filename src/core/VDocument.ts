import { ElementHandle, EvaluateFn, Page } from 'puppeteer-core'
import { StyleSheetData } from '../types'

export class VDocument {
    static async create(page: Page, fn: EvaluateFn) {
        const handle = await page.evaluateHandle(fn)
        return new VDocument(page, handle.asElement()!)
    }

    private constructor(public page: Page, private documentHandle: ElementHandle<Element>) {}

    async eval<T, A extends any[]>(fn: (document: Document, ...args: A) => T, ...args: A) {
        const result = await this.page.evaluate(fn as any, this.documentHandle, ...args)
        return result as T
    }

    clean() {
        return this.eval(document => {
            const els = document.querySelectorAll(
                'script, style, link[rel=stylesheet], link[rel=preload], link[rel=dns-prefetch]'
            )
            els.forEach(el => el.remove())
        })
    }

    getSheetDataList() {
        return this.eval(document => {
            const sheets = [...document.styleSheets]
                .filter((s): s is CSSStyleSheet => s instanceof CSSStyleSheet)
                .filter(s => !s.disabled)

            return sheets.map<StyleSheetData>(s => {
                if (s.href) {
                    return { link: s.href }
                } else {
                    try {
                        return { text: [...s.cssRules].map(rule => rule.cssText).join('\n') }
                    } catch (error) {
                        return { error }
                    }
                }
            })
        })
    }

    reallocateCSS(cssTexts: string[]) {
        return this.eval((document, cssTexts) => {
            const styleElements = cssTexts.map(text => {
                const el = document.createElement('style')
                el.dataset.vanillaClipperStyle = ''
                el.innerHTML = text
                return el
            })
            document.head.append(...styleElements)
        }, cssTexts)
    }

    data() {
        return this.eval(document => {
            const elements = [
                ...document.querySelectorAll("[src]:not([src='']), [href]:not([href='']):not(a)"),
            ] as HTMLElement[]

            const urls = elements.reduce(
                (_urls, el) => {
                    const { src, href } = el as any

                    if (src) {
                        _urls.push(src)
                        el.dataset.vanillaClipperSrc = src
                        el.removeAttribute('src')
                    }
                    if (href) {
                        _urls.push(href)
                        el.dataset.vanillaClipperHref = href
                        el.removeAttribute('href')
                    }
                    return _urls
                },
                [] as string[]
            )

            return urls
        })
    }

    appendScript(scriptString: string) {
        return this.eval((document, scriptString) => {
            const el = document.createElement('script')
            el.dataset.vanillaClipperScript = ''
            el.innerHTML = scriptString
            document.body.appendChild(el)
        }, scriptString)
    }
}
