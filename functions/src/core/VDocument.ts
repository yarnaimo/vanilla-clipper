import { Rarray } from '@yarnaimo/rain'
import { EvaluateFn, Frame, Page } from 'puppeteer'
import { StyleSheetData } from '../types'
import { buildVAttrSelector } from '../utils/element'
import { VFrame } from './VFrame'

export const VDocument = async (frame: Frame | Page, fn: EvaluateFn) => ({
    frame,
    documentHandle: (await frame.evaluateHandle(fn)).asElement()!,

    async eval<T, A extends any[]>(fn: (document: Document, ...args: A) => T, ...args: A) {
        const result = await this.frame.evaluate(fn as any, this.documentHandle, ...args)
        return result as T
    },

    async $(selector: string) {
        const result = await this.documentHandle.$(selector)
        return result
    },

    async $$(selector: string) {
        const result = await this.documentHandle.$$(selector)
        return result
    },

    async getHTML() {
        return await this.eval(document => ({
            html: document.documentElement.outerHTML,
            location: document.location,
        }))
    },

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
    },

    async setUuidToIFramesAndShadowHosts() {
        return await this.eval(document => {
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
    },

    async embedContentOfShadowDOMs() {
        return await this.eval(document => {
            document.querySelectorAll<HTMLElement>('*').forEach(el => {
                if (!el.shadowRoot) {
                    return
                }

                // const cssTexts = [...el.shadowRoot.styleSheets]
                //     .filter((s): s is CSSStyleSheet => s instanceof CSSStyleSheet)
                //     .filter(s => !s.disabled && !s.href)
                //     .map(s => [...s.cssRules].map(rule => rule.cssText).join('\n'))

                // el.shadowRoot.querySelectorAll('style').forEach(el => {
                //     el.remove()
                // })

                el.dataset.vanillaClipperShadowContent = el.shadowRoot.innerHTML
                // el.dataset.vanillaClipperShadowStyles = JSON.stringify(cssTexts)
            })
        })
    },

    async replaceObjectURLsWithDataURL() {
        await this.eval(async document => {
            async function toDataURL(objectURL: string) {
                const blob = await fetch(objectURL)
                    .then(res => res.blob())
                    .catch(() => null)

                if (!blob) {
                    return
                }

                return new Promise<string>(resolve => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.readAsDataURL(blob)
                })
            }

            await Promise.all([
                ...[...document.querySelectorAll<HTMLElement>('[src^="blob:"]')].map(async el => {
                    const dataURL = await toDataURL(el.getAttribute('src')!)
                    if (!dataURL) {
                        return
                    }
                    el.setAttribute('src', dataURL)
                }),

                ...[...document.querySelectorAll<HTMLElement>('[href^="blob:"]')].map(async el => {
                    const dataURL = await toDataURL(el.getAttribute('href')!)
                    if (!dataURL) {
                        return
                    }
                    el.setAttribute('href', dataURL)
                }),
            ])
        })

        await this.frame.waitFor(5000)
    },

    async clipIframes(jsdomIframeElements: HTMLElement[]) {
        const iframeUuids = jsdomIframeElements.map(el => el.dataset.vanillaClipperIframeUuid!)

        return await Rarray.waitAll(iframeUuids, async uuid => {
            try {
                const handle = await this.$(buildVAttrSelector.iframeUuid(uuid))

                const frame = await handle!.contentFrame()
                const vFrame = VFrame(frame!, false)
                const { html } = await vFrame._clip({})
                return { uuid, html }
            } catch (error) {
                return { uuid, html: '' }
            }
        })
    },

    async click(selector: string) {
        await this.eval((document, selector) => {
            const els = document.querySelectorAll(selector)
            els.forEach(el => {
                if ('click' in el) (el as HTMLElement).click()
            })
        }, selector)

        await this.frame.waitFor(1000)
    },

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
                    if (!isScrollable(el)) {
                        return
                    }

                    for (const _ of Array(maxScrolls)) {
                        el.scrollTo({ behavior: 'smooth', top: el.scrollHeight })
                        await waitFor(2.5)

                        if (atBottom(el)) {
                            break
                        }
                    }
                    if (height < el.scrollHeight) height = el.scrollHeight
                    el.scrollTo({ top: 0 })
                }

                async function recurse(el: Element) {
                    if (isScrollable(el)) {
                        await scrollElement(el)
                    } else {
                        const parent = el.parentElement
                        if (parent) {
                            await recurse(parent)
                        }
                    }
                }

                const isScrollable = (el: Element) => {
                    if (el.clientHeight >= el.scrollHeight) {
                        return false
                    }

                    const top = el.scrollTop
                    el.scrollBy(0, 1)

                    return el.scrollTop === top + 1
                }
                const atBottom = (el: Element) => el.scrollHeight <= el.scrollTop + el.clientHeight

                if (scroll) {
                    const target = document.querySelector(scroll)
                    // if (target) await scrollElement(target)
                    if (target) {
                        await recurse(target)
                    }
                } else if (element) {
                    const target = document.querySelector(element)
                    if (target) {
                        await recurse(target)
                    }
                } else {
                    await scrollElement(document.documentElement)
                    await scrollElement(document.body)
                }

                return height
            },
            element,
            scroll,
            maxScrolls,
        )
    },
})
