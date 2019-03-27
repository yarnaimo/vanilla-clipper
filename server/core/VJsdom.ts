import { minify } from 'html-minifier'
import { ConstructorOptions, JSDOM, VirtualConsole } from 'jsdom'
import { DateTime } from 'luxon'
import { storeResource } from '../../src/models/resource'
import { jsdomPlugins } from '../plugins'
import { IFrameData, IMetadata } from '../types'
import { optimizeCSS } from '../utils/css'
import { buildVAttrSelector, ElementSelector, selectorsToString } from '../utils/element'
import { dataURLPattern } from '../utils/file'
import { getTwitterVideoURL as getVideoURLInTweet } from '../utils/twitter'

export type HTMLGenerationResult = { url: string; html: string; createdAt?: DateTime }

export class VJsdom {
    static parseMetadata(meta: HTMLMetaElement): IMetadata {
        const parsed = JSON.parse(meta.content)
        return { ...parsed, _createdAt: DateTime.fromISO(parsed._createdAt).toUTC() }
    }

    dom: JSDOM

    doctype = '<!DOCTYPE html>'

    metadata?: IMetadata

    get document() {
        return this.dom.window.document
    }

    get location() {
        return this.dom.window.location
    }

    get metaElement() {
        return this.document.querySelector<HTMLMetaElement>('meta[name=vanilla-clipper]')
    }

    constructor(html: string, options: ConstructorOptions = {}) {
        const virtualConsole = new VirtualConsole()
        this.dom = new JSDOM(html, { ...options, virtualConsole })

        const meta = this.metaElement

        if (meta) {
            this.metadata = VJsdom.parseMetadata(meta)
        }

        virtualConsole.sendTo(console, { omitJSDOMErrors: true })
    }

    generate(): HTMLGenerationResult {
        const html = `${this.doctype}\n${this.document.documentElement.outerHTML}`
        const url = this.location.href

        const minified = (() => {
            try {
                return minify(html, { minifyJS: true, minifyCSS: true })
            } catch (error) {
                return html
            }
        })()

        return {
            html: minified,
            url,
            createdAt: this.metadata && this.metadata._createdAt,
        }
    }

    finder<T extends Element = HTMLElement>(...selectors: ElementSelector[]) {
        return [...this.document.querySelectorAll<T>(selectorsToString(...selectors))]
    }

    execPlugins() {
        jsdomPlugins.exec(this)
    }

    setElementAsRoot(selector: string) {
        const el = this.document.body.querySelector(selector)
        if (el) {
            this.document.body.innerHTML = el.outerHTML
        }
    }

    getIframes() {
        return this.finder(buildVAttrSelector.iframeUuid())
    }

    private replaceVideoElement(oldElement: HTMLElement, url: string, isGif: boolean) {
        const el = this.document.createElement('video')
        el.dataset.vanillaClipperVideo = isGif ? 'gif' : 'video'
        el.src = url

        el.style.width = '100%'
        el.style.height = '100%'
        el.style.position = 'relative'

        if (isGif) {
            el.setAttribute('muted', '')
        }
        el.autoplay = isGif
        el.loop = isGif
        el.controls = true

        // oldElement.closest('.PlayableMedia-reactWrapper')!.replaceWith(el)
        oldElement.parentElement!.parentElement!.parentElement!.replaceWith(el)
    }

    async embedTwitterVideo(tweetID: string) {
        const gifElement = this.document.querySelector<HTMLImageElement>(
            'img[src*="/tweet_video_thumb/"]',
        )
        const videoElement = this.document.querySelector<HTMLImageElement>(
            'img[src*="/ext_tw_video_thumb/"]',
        )

        if (gifElement) {
            const media = await getVideoURLInTweet(tweetID)
            if (!media) return

            this.replaceVideoElement(gifElement, media.url, true)
        }

        if (videoElement) {
            const media = await getVideoURLInTweet(tweetID)
            if (!media) return

            this.replaceVideoElement(videoElement, media.url, false)
        }
    }

    embedIFrameContents(iframeDataList: IFrameData[]) {
        return iframeDataList.map(({ uuid, html }) => {
            const iframe = this.finder(buildVAttrSelector.iframeUuid(uuid))[0] as HTMLIFrameElement

            delete iframe.dataset.vanillaClipperIframeUuid
            iframe.srcdoc = html
            iframe.dataset.vanillaClipperSrc = iframe.src
            iframe.removeAttribute('src')
            return iframe
        })
    }

    async processResourcesInAttrs(noStoring = false) {
        const process = async (
            el: HTMLElement,
            attrName: string,
            vcPropName: 'vanillaClipperSrc' | 'vanillaClipperHref',
        ) => {
            const originalUrl = el.dataset[vcPropName] || el.getAttribute(attrName)!
            const storedDataUrlOrFileUrl =
                (el.dataset[vcPropName] && el.getAttribute(attrName)) || undefined

            if (dataURLPattern.test(originalUrl)) {
                return
            }

            el.dataset[vcPropName] = originalUrl

            if (noStoring) {
                return
            }

            const version = await storeResource(
                this.location.href,
                originalUrl,
                storedDataUrlOrFileUrl,
            )
            if (!version) {
                return
            }

            el.setAttribute(attrName, version.url)
        }

        await Promise.all([
            ...this.finder({ selector: '[src]', not: ['[src=""]', 'iframe'] }).map(async el => {
                el.removeAttribute('srcset')
                await process(el, 'src', 'vanillaClipperSrc')
            }),

            ...this.finder({
                selector: '[href]',
                not: [
                    '[href=""]',
                    'a',
                    'div',
                    '[rel~=alternate]',
                    '[rel~=canonical]',
                    '[rel~=prev]',
                    '[rel~=next]',
                ],
            }).map(async el => {
                await process(el, 'href', 'vanillaClipperHref')
            }),
        ])
    }

    async optimizeStylesInShadowDOM() {
        await Promise.all(
            this.finder(buildVAttrSelector.shadowContent()).map(async host => {
                if (!host.dataset.vanillaClipperShadowContent) {
                    return
                }

                const shadow = host.attachShadow({ mode: 'open' })

                shadow.innerHTML = host.dataset.vanillaClipperShadowContent

                const cssTexts = [] as string[]
                shadow.querySelectorAll('style').forEach(el => {
                    cssTexts.push(el.innerHTML)
                    el.remove()
                })

                const optimized = await Promise.all(
                    cssTexts.map(text => optimizeCSS({ text, url: this.location.href }), shadow),
                )

                this.appendStyleSheets(optimized, shadow)

                host.dataset.vanillaClipperShadowContent = shadow.innerHTML
            }),
        )
    }

    appendStyleSheets(cssTexts: string[], shadowRoot?: ShadowRoot) {
        const styleElements = cssTexts.map(text => {
            const el = this.document.createElement('style')
            el.dataset.vanillaClipperStyle = ''
            el.innerHTML = text
            return el
        })
        ;(shadowRoot ? shadowRoot : this.document.head).append(...styleElements)
    }

    appendScriptToHead() {
        const shadowHostSelector = buildVAttrSelector.shadowContent()
        const videoElementSelector = buildVAttrSelector.video()

        async function main() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', onload)
            } else {
                onload()
            }

            function onload() {
                const videoElement = document.querySelector<HTMLVideoElement>(videoElementSelector)

                if (videoElement) {
                    const playOrPause = () =>
                        videoElement.paused ? videoElement.play() : videoElement.pause()

                    videoElement.onclick = playOrPause

                    document.body.onkeypress = () => {
                        if ((window.event as KeyboardEvent).keyCode === 32) {
                            ;(window.event as KeyboardEvent).preventDefault()
                            playOrPause()
                        }
                    }
                }

                const shadowHosts = document.querySelectorAll<HTMLElement>(shadowHostSelector)

                shadowHosts.forEach(host => {
                    if (!host.dataset.vanillaClipperShadowContent) {
                        return
                    }

                    const shadow = host.attachShadow({ mode: 'open' })

                    shadow.innerHTML = host.dataset.vanillaClipperShadowContent
                })
            }
        }

        const script = this.document.createElement('script')
        script.dataset.vanillaClipperScript = ''
        script.innerHTML = `
            const shadowHostSelector = '${shadowHostSelector}'
            const videoElementSelector = '${videoElementSelector}'

            ${main.toString()}
            main()
        `
        this.document.head.appendChild(script)
    }
}
