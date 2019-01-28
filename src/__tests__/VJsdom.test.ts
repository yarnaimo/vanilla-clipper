import { VJsdom } from '../core/VJsdom'
import { getVAttrSelector } from '../utils/element'

const src = '/src-path'
const href = '/href-path'

test('embedIFrameContents()', () => {
    const html = 'iframe content'
    const uuid = '1234'

    const dom = new VJsdom(`
        <html>
            <body>
                <iframe src="${src}" data-vanilla-clipper-iframe-uuid=${uuid}></iframe>
            </body>
        </html>
    `)
    const iframes = dom.embedIFrameContents([{ uuid, html }])

    expect(iframes).toHaveLength(1)
    expect(iframes[0]).toMatchObject({
        src: '',
        srcdoc: html,
    })
    expect(iframes[0].dataset).toMatchObject({ vanillaClipperSrc: src })
})

test('moveAttrToDatasetAndReturnURLs()', () => {
    const dom = new VJsdom(`
        <html>
            <body>
                <img src="${src}" />
                <img src="data:image/png;base64," />
                <link href="${href}"></a>
                <link href="data:text/css;base64,"></a>
            </body>
        </html>
    `)

    const urls = dom.moveAttrToDatasetAndReturnURLs()

    expect(urls).toEqual(new Set([href, src]))
    expect(dom.finder({ selector: getVAttrSelector.src(src), not: ['[src]'] })).toHaveLength(1)
    expect(dom.finder({ selector: getVAttrSelector.href(href), not: ['[href]'] })).toHaveLength(1)
})

test('appendScriptToHead()', () => {
    const dom = new VJsdom(`
        <html>
            <head></head>
            <body></body>
        </html>
    `)
    const script = "console.log('script')"
    dom.appendScriptToHead(script)

    expect(dom.document.head.querySelector(getVAttrSelector.script())!.innerHTML).toBe(script)
})
