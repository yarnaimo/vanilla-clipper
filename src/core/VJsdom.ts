import { ConstructorOptions, JSDOM, VirtualConsole } from 'jsdom'
import { jsdomPlugins } from '../plugins'
import { IFrameData } from '../types'
import { dataURLPattern } from '../utils/data'
import { ElementSelector, getVAttrSelector, selectorsToString } from '../utils/element'
import { getTwitterVideoURL as getVideoURLInTweet } from '../utils/twitter'

export class VJsdom {
    dom: JSDOM

    get document() {
        return this.dom.window.document
    }

    constructor(html: string, options: ConstructorOptions = {}) {
        const virtualConsole = new VirtualConsole()
        this.dom = new JSDOM(html, { ...options, virtualConsole })

        virtualConsole.sendTo(console, { omitJSDOMErrors: true })
    }

    finder<T extends Element = HTMLElement>(...selectors: ElementSelector[]) {
        return [...this.document.querySelectorAll<T>(selectorsToString(...selectors))]
    }

    execPlugins() {
        jsdomPlugins.exec(this)
    }

    setElementAsRoot(selector: string) {
        const el = this.document.body.querySelector(selector)
        if (el) this.document.body.innerHTML = el.outerHTML
    }

    getIframes() {
        return this.finder(getVAttrSelector.iframeUuid())
    }

    private replaceVideoElement(oldElement: HTMLElement, url: string, isGif: boolean) {
        const el = this.document.createElement('video')
        el.dataset.vanillaClipperVideo = isGif ? 'gif' : 'video'
        el.src = url

        el.style.width = '100%'
        el.style.height = '100%'
        el.style.position = 'relative'

        if (isGif) el.setAttribute('muted', '')
        el.autoplay = isGif
        el.loop = isGif
        el.controls = true

        // oldElement.closest('.PlayableMedia-reactWrapper')!.replaceWith(el)
        oldElement.parentElement!.parentElement!.parentElement!.replaceWith(el)
    }

    async embedTwitterVideo(tweetID: string) {
        const gifElement = this.document.querySelector<HTMLImageElement>(
            'img[src*="/tweet_video_thumb/"]'
        )
        const videoElement = this.document.querySelector<HTMLImageElement>(
            'img[src*="/ext_tw_video_thumb/"]'
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
            const iframe = this.finder(getVAttrSelector.iframeUuid(uuid))[0] as HTMLIFrameElement

            delete iframe.dataset.vanillaClipperIframeUuid
            iframe.srcdoc = html
            iframe.dataset.vanillaClipperSrc = iframe.src
            iframe.removeAttribute('src')
            return iframe
        })
    }

    moveAttrToDatasetAndReturnURLs() {
        const urlsInAttrs = new Set<string>()
        {
            this.finder({ selector: '[src]', not: ['[src=""]', 'iframe'] }).forEach(el => {
                const url = el.getAttribute('src')!
                if (dataURLPattern.test(url)) return

                el.removeAttribute('src')
                el.removeAttribute('srcset')
                el.dataset.vanillaClipperSrc = url
                urlsInAttrs.add(url)
            })

            this.finder({
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
            }).forEach(el => {
                const url = el.getAttribute('href')!
                if (dataURLPattern.test(url)) return

                el.removeAttribute('href')
                el.dataset.vanillaClipperHref = url
                urlsInAttrs.add(url)
            })
        }

        return urlsInAttrs
    }

    appendScriptToHead(scriptString: string) {
        const script = this.document.createElement('script')
        script.dataset.vanillaClipperScript = ''
        script.innerHTML = scriptString
        this.document.head.appendChild(script)
    }
}
