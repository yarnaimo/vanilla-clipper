import { IFrameData } from '../types'
import { dataURLPattern } from './data'
import { ElementFinder, getVAttrSelector } from './element'

export function embedIFrameContents(finder: ElementFinder, iframeDataList: IFrameData[]) {
    return iframeDataList.map(({ uuid, html }) => {
        const iframe = finder(getVAttrSelector.iframeUuid(uuid))[0] as HTMLIFrameElement

        delete iframe.dataset.vanillaClipperIframeUuid
        iframe.srcdoc = html
        iframe.dataset.vanillaClipperSrc = iframe.src
        iframe.removeAttribute('src')
        return iframe
    })
}

export function moveAttrToDatasetAndReturnURLs(finder: ElementFinder) {
    const urlsInAttrs = new Set<string>()
    {
        finder({ selector: '[src]', not: ['[src=""]', 'iframe'] }).forEach(el => {
            const url = el.getAttribute('src')!
            if (dataURLPattern.test(url)) return

            el.removeAttribute('src')
            el.dataset.vanillaClipperSrc = url
            urlsInAttrs.add(url)
        })

        finder({
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

export function appendScriptToHead(document: Document, scriptString: string) {
    const script = document.createElement('script')
    script.dataset.vanillaClipperScript = ''
    script.innerHTML = scriptString
    document.head.appendChild(script)
}
