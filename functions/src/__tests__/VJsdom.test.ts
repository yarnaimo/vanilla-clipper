import { VJsdom } from '../core/VJsdom'
import { buildVAttrSelector } from '../utils/element'

const src = '/src-path'
const href = '/href-path'

// test('metadata', () => {
//     const dom = new VJsdom(
//         `
//             <html>
//                 <body>
//                     <title>Title</title>
//                 </body>
//             </html>
//         `,
//         { url: 'https://foo.example.com/path' }
//     )

//     dom.insertMetadataToDocument()

//     const metadata = VJsdom.parseMetadata(dom.metaElement!)

//     expect(metadata).toEqual({
//         _version: 1,
//         _createdAt: expect.any(DateTime),
//         domain: 'example.com',
//         hostname: 'foo.example.com',
//         url: 'https://foo.example.com/path',
//         title: 'Title',
//     })
// })

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

test('processResourcesInAttrs()', async () => {
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

    await dom.processResourcesInAttrs(true)

    expect(dom.finder({ selector: buildVAttrSelector.src(src), not: [] })).toHaveLength(1)
    expect(dom.finder({ selector: buildVAttrSelector.href(href), not: [] })).toHaveLength(1)
})

test('appendScriptToHead()', () => {
    const dom = new VJsdom(`
        <html>
            <head></head>
            <body></body>
        </html>
    `)
    dom.appendScriptToHead()

    expect(dom.document.head.querySelector(buildVAttrSelector.script())!.innerHTML).toMatch(
        'function main() {',
    )
})
