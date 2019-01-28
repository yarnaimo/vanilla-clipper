import { Rarray } from '@yarnaimo/rain'
import { ElementHandle, EvaluateFn } from 'puppeteer-core'
import { VFrame } from '..'
import { StyleSheetData } from '../types'
import { getVAttrSelector } from '../utils/element'

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

    async getMetadata() {
        return await this.eval(document => ({
            doctype: document.doctype
                ? new XMLSerializer().serializeToString(document.doctype)
                : undefined,
            html: document.documentElement.outerHTML,
            title: document.title,
            location: document.location,
        }))
    }

    async getSheetDataList() {
        return await this.eval(document => {
            const sheets = [...document.styleSheets]
                .filter((s): s is CSSStyleSheet => s instanceof CSSStyleSheet)
                .filter(s => !s.disabled)

            return sheets.map<StyleSheetData>(s => {
                if (s.href) {
                    return { type: 'link', url: s.href }
                } else {
                    try {
                        return {
                            type: 'text',
                            url: document.location.href,
                            text: [...s.cssRules].map(rule => rule.cssText).join('\n'),
                        }
                    } catch (error) {
                        return { type: 'error', url: document.location.href, error: error }
                    }
                }
            })
        })
    }

    async setUuidToIFrames() {
        await this.eval(document => {
            function uuidv4() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = (Math.random() * 16) | 0,
                        v = c == 'x' ? r : (r & 0x3) | 0x8
                    return v.toString(16)
                })
            }

            document.querySelectorAll('iframe').forEach(el => {
                el.dataset.vanillaClipperIframeUuid = uuidv4()
            })
        })
    }

    async clipIframes(jsdomIframeElements: HTMLElement[]) {
        const iframeUuids = jsdomIframeElements.map(el => el.dataset.vanillaClipperIframeUuid!)

        return await Rarray.waitAll(iframeUuids, async uuid => {
            try {
                const handle = await this.$(getVAttrSelector.iframeUuid(uuid))

                const frame = await handle!.contentFrame()
                const vFrame = new VFrame(this.vFrame.vBrowser, frame!)
                const { html } = await vFrame.clip()
                return { uuid, html }
            } catch (error) {
                return { uuid, html: '' }
            }
        })
    }

    async click(selector: string) {
        await this.eval((document, selector) => {
            const els = document.querySelectorAll(selector)
            els.forEach(el => {
                if ('click' in el) (el as HTMLElement).click()
            })
        }, selector)
        await this.vFrame.frame.waitFor(1000)
    }

    async scrollToBottom({
        element,
        scroll,
        maxScrolls,
    }: {
        element?: string
        scroll?: string
        maxScrolls: number
    }) {
        return await this.eval(
            async (document, element, scroll, maxScrolls) => {
                const waitFor = (seconds: number) =>
                    new Promise(resolve => setTimeout(resolve, 1000 * seconds))

                let height = 0

                async function scrollElement(el: Element) {
                    if (!isScrollable(el)) return

                    for (const _ of Array(maxScrolls)) {
                        el.scrollTo({ behavior: 'smooth', top: el.scrollHeight })
                        await waitFor(2.5)

                        if (atBottom(el)) break
                    }
                    if (height < el.scrollHeight) height = el.scrollHeight
                    el.scrollTo({ top: 0 })
                }

                async function recurse(el: Element) {
                    if (isScrollable(el)) {
                        await scrollElement(el)
                    } else {
                        const parent = el.parentElement
                        if (parent) await recurse(parent)
                    }
                }

                const isScrollable = (el: Element) => {
                    if (el.clientHeight >= el.scrollHeight) return false

                    const top = el.scrollTop
                    el.scrollBy(0, 1)

                    return el.scrollTop === top + 1
                }
                const atBottom = (el: Element) => el.scrollHeight <= el.scrollTop + el.clientHeight

                if (scroll) {
                    const target = document.querySelector(scroll)
                    // if (target) await scrollElement(target)
                    if (target) await recurse(target)
                } else if (element) {
                    const target = document.querySelector(element)
                    if (target) await recurse(target)
                } else {
                    await scrollElement(document.documentElement)
                    await scrollElement(document.body)
                }
                return height
            },
            element,
            scroll,
            maxScrolls
        )
    }
}
