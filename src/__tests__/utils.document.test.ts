import { JSDOM } from 'jsdom'
import {
    appendScriptToHead,
    embedIFrameContents,
    moveAttrToDatasetAndReturnURLs,
} from '../utils/document'
import { createElementFinder, getVAttrSelector } from '../utils/element'

const createDocument = (html: string) => new JSDOM(html).window.document
const src = '/src-path'
const href = '/href-path'

test('embedIFrameContents()', () => {
    const html = 'iframe content'
    const uuid = '1234'

    const document = createDocument(`
        <html>
            <body>
                <iframe src="${src}" data-vanilla-clipper-iframe-uuid=${uuid}></iframe>
            </body>
        </html>
    `)
    const finder = createElementFinder(document)

    const iframes = embedIFrameContents(finder, [{ uuid, html }])

    expect(iframes).toHaveLength(1)
    expect(iframes[0]).toMatchObject({
        src: '',
        srcdoc: html,
    })
    expect(iframes[0].dataset).toMatchObject({ vanillaClipperSrc: src })
})

test('moveAttrToDatasetAndReturnURLs()', () => {
    const document = createDocument(`
        <html>
            <body>
                <img src="${src}" />
                <img src="data:image/png;base64," />
                <link href="${href}"></a>
                <link href="data:text/css;base64,"></a>
            </body>
        </html>
    `)
    const finder = createElementFinder(document)

    const urls = moveAttrToDatasetAndReturnURLs(finder)

    expect(urls).toEqual(new Set([href, src]))
    expect(finder({ selector: getVAttrSelector.src(src), not: ['[src]'] })).toHaveLength(1)
    expect(finder({ selector: getVAttrSelector.href(href), not: ['[href]'] })).toHaveLength(1)
})

test('appendScriptToHead()', () => {
    const document = createDocument(`
        <html>
            <head></head>
            <body></body>
        </html>
    `)
    const script = "console.log('script')"
    appendScriptToHead(document, script)

    expect(document.head.querySelector(getVAttrSelector.script())!.innerHTML).toBe(script)
})
