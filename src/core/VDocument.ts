import { ElementHandle, EvaluateFn } from 'puppeteer-core'
import { VFrame } from '..'
import { StyleSheetData } from '../types'

export class VDocument {
    static async create(vFrame: VFrame, fn: EvaluateFn) {
        const handle = await vFrame.frame.evaluateHandle(fn)
        return new VDocument(vFrame, handle.asElement()!)
    }

    private constructor(public vFrame: VFrame, private documentHandle: ElementHandle<Element>) {}

    async eval<T, A extends any[]>(fn: (document: Document, ...args: A) => T, ...args: A) {
        const result = await this.vFrame.frame.evaluate(fn as any, this.documentHandle, ...args)
        return result as T
    }

    async $$(selector: string) {
        const result = await this.documentHandle.$$(selector)
        return result
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

    getIFrameHandles() {
        return this.$$('iframe')
    }

    setIFramesSrcdoc(vFrameHTMLs: string[], elements: ElementHandle[]) {
        return this.eval(
            (document, vFrameHTMLs, ...elements) => {
                elements.forEach((el, i) => {
                    el.srcdoc = vFrameHTMLs[i]
                    el.dataset.vanillaClipperSrc = el.src
                    el.removeAttribute('src')
                })
            },
            vFrameHTMLs,
            ...((elements as any) as HTMLIFrameElement[])
        )
    }

    async getDataSourceURLs() {
        const urls = await this.eval(document => {
            const elements = document.querySelectorAll<HTMLElement>(
                [
                    "[src]:not([src='']):not(iframe)",

                    [
                        '[href=""]',
                        'a',
                        '[rel~=alternate]',
                        '[rel~=canonical]',
                        '[rel~=prev]',
                        '[rel~=next]',
                    ].reduce((prev, current) => `${prev}:not(${current})`, '[href]'),
                ].join()
            )

            const urls = [...elements].reduce(
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

        return new Set(urls)
    }

    appendScript(scriptString: string) {
        return this.eval((document, scriptString) => {
            const el = document.createElement('script')
            el.dataset.vanillaClipperScript = ''
            el.innerHTML = scriptString
            document.head.appendChild(el)
        }, scriptString)
    }
}
