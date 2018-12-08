import { Handler } from '../core/Handler'
import { VPage } from '../core/VPage'

let vPage: VPage

beforeEach(async () => {
    await page.goto('http://localhost:3000/page.html')
    vPage = await VPage.create(page, false)
})

test('.clean()', async () => {
    await vPage.eval(false, Handler.clean)
    const received = await page.$$eval('script, style, link[rel=stylesheet]', els => els)
    expect(received).toHaveLength(0)
})

test('.getStyleSheets()', async () => {
    const received = await vPage.eval(false, Handler.getStyleSheets)
    expect(received).toEqual([
        { link: 'http://localhost:3000/main.css' },
        { text: expect.stringMatching(/\.style-tag/) },
    ])
})

test('.reallocateCSS()', async () => {
    const css = ['.reallocated {}']
    await page.$$eval('style, link[rel=stylesheet]', els => els.forEach(el => el.remove()))
    await vPage.eval(false, Handler.reallocateCSS, css)

    const received = await page.$$eval('head > style[data-vanilla-style]', els =>
        els.map(el => el.innerHTML)
    )
    expect(received).toEqual(css)
})

test('.data()', async () => {
    const received = await vPage.eval(false, Handler.data)
    expect(received).toContain('http://localhost:3000/icon.png')
})

test('.appendScript()', async () => {
    const scriptString = "console.log('appended script')"
    await vPage.eval(false, Handler.appendScript, scriptString)

    const received = await page.$eval('script[data-vanilla-script]', el => el.innerHTML)
    expect(received).toBe(scriptString)
})
