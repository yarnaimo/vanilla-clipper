import { readFile } from 'fs-extra'
import { resolve } from 'path'
import { Frame, Page } from 'puppeteer-core'
import { VBrowser } from '../core/VBrowser'
import { VMetadata } from '../core/VMetadata'
import { launch } from './utils'

let vBrowser: VBrowser
let metadata: VMetadata
let html: string
let savedPage: Page
let childFrame: Frame

beforeAll(async () => {
    vBrowser = await launch()
    const vPage = await vBrowser.newPage('http://localhost:3000/page.html')
    const clipped = await vPage.clip()
    await vPage.close()

    metadata = clipped.metadata!
    html = clipped.html
})

beforeEach(async () => {
    savedPage = (await vBrowser.newPage()).frame
    await savedPage.setContent(html)
    childFrame = savedPage.frames()[1]
})

afterEach(async () => {
    await savedPage.close()
})

afterAll(async done => {
    await vBrowser.close()
    done()
})

test('metadata', async () => {
    expect(metadata).toMatchObject({
        _version: 1,
        domain: 'localhost',
        hostname: 'localhost',
        url: 'http://localhost:3000/page',
        title: 'Vanilla Test',
    })
})

test('element count', async () => {
    await expect(
        savedPage.$$('link[rel=stylesheet], [src]:not([data-vanilla-clipper-src]):not(a)')
    ).resolves.toHaveLength(0)

    await expect(savedPage.$$('head style[data-vanilla-clipper-style]')).resolves.toHaveLength(2)
    await expect(savedPage.$$('body script[data-vanilla-clipper-script]')).resolves.toHaveLength(1)
    await expect(
        savedPage.$$('body img[data-vanilla-clipper-src="http://localhost:3000/icon.png"]')
    ).resolves.toHaveLength(1)
})

test('style[data-vanilla-clipper-style] content', async () => {
    const texts = await savedPage.$$eval('head style[data-vanilla-clipper-style]', els =>
        els.map(el => el.innerHTML)
    )
    expect(texts).toEqual([
        expect.stringContaining('.external'),
        expect.stringContaining('.style-tag'),
    ])
})

test('set [src] attribute from dataMap', async () => {
    const src = await savedPage.$eval('img[data-vanilla-clipper-src]', img =>
        img.getAttribute('src')
    )
    const iconBuffer = await readFile(resolve('src/__tests__/public/icon.png'))

    expect(src).toBe('data:image/png;base64,' + iconBuffer.toString('base64'))
})

test('iframe - element count', async () => {
    await expect(
        childFrame.$$('link[rel=stylesheet], [src]:not([data-vanilla-clipper-src]):not(a)')
    ).resolves.toHaveLength(0)

    await expect(childFrame.$$('head style[data-vanilla-clipper-style]')).resolves.toHaveLength(2)
    await expect(childFrame.$$('body script[data-vanilla-clipper-script]')).resolves.toHaveLength(1)
    await expect(
        childFrame.$$('body img[data-vanilla-clipper-src="http://localhost:3000/icon.png"]')
    ).resolves.toHaveLength(1)
})
