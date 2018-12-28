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

    async $(selector: string) {
        const result = await this.documentHandle.$(selector)
        return result
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
                    return { type: 'link', link: s.href }
                } else {
                    try {
                        return {
                            type: 'text',
                            text: [...s.cssRules].map(rule => rule.cssText).join('\n'),
                        }
                    } catch (error) {
                        return { type: 'error', error: error }
                    }
                }
            })
        })
    }

    setUuidToIFrames() {
        this.eval(document => {
            function uuidv4() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = (Math.random() * 16) | 0,
                        v = c == 'x' ? r : (r & 0x3) | 0x8
                    return v.toString(16)
                })
            }

            document.querySelectorAll('iframe').forEach(el => {
                el.dataset.vanillaClipperIframeUuid = uuidv4()
            })
        })
    }
}
