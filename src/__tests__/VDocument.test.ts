import { VDocument } from '../core/VDocument'
import { VPage } from '../core/VPage'

let vDocument: VDocument

beforeEach(async () => {
    await page.goto('http://localhost:3000/page.html')
    vDocument = await VDocument.create(new VPage(page), () => document)
})

// test('.clean()', async () => {
//     await vDocument.clean()
//     const received = await page.$$eval('script, style, link[rel=stylesheet]', els => els)
//     expect(received).toHaveLength(0)
// })

test('.getStyleSheets()', async () => {
    const received = await vDocument.getSheetDataList()
    expect(received).toEqual([
        { link: 'http://localhost:3000/main.css' },
        { text: expect.stringMatching(/\.style-tag/) },
    ])
})

// test('.reallocateCSS()', async () => {
//     const css = ['.reallocated {}']
//     await page.$$eval('style, link[rel=stylesheet]', els => els.forEach(el => el.remove()))
//     await vDocument.reallocateCSS(css)

//     const received = await page.$$eval('head > style[data-vanilla-clipper-style]', els =>
//         els.map(el => el.innerHTML)
//     )
//     expect(received).toEqual(css)
// })

test('.data()', async () => {
    const received = await vDocument.getDataSourceURLs()
    expect(received).toContain('http://localhost:3000/icon.png')
})

test('.appendScript()', async () => {
    const scriptString = "console.log('appended script')"
    await vDocument.appendScript(scriptString)

    const received = await page.$eval('script[data-vanilla-clipper-script]', el => el.innerHTML)
    expect(received).toBe(scriptString)
})
