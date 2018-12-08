import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Browser, launch, Page } from 'puppeteer'
import { VMetadata } from '../core/VMetadata'
import { VPage } from '../core/VPage'
import { noSandboxArgs } from '../utils'

let browser: Browser
let metadata: VMetadata
let savedPage: Page

beforeAll(async () => {
    browser = await launch({ args: noSandboxArgs })
})

beforeEach(async () => {
    const page = await browser.newPage()
    await page.goto('http://localhost:3000/page.html')

    const vPage = await VPage.create(page)
    const { html, metadata: _metadata } = await vPage.clip()
    metadata = _metadata
    savedPage = await browser.newPage()
    await savedPage.setContent(html)
})

afterAll(async () => {
    await browser.close()
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

test('element counts', async () => {
    await expect(
        savedPage.$$('link[rel=stylesheet], [src]:not([data-vanilla-src]):not(a)')
    ).resolves.toHaveLength(0)

    await expect(savedPage.$$('head style[data-vanilla-style]')).resolves.toHaveLength(2)
    await expect(savedPage.$$('body script[data-vanilla-script]')).resolves.toHaveLength(1)
    await expect(
        savedPage.$$('body img[data-vanilla-src="http://localhost:3000/icon.png"]')
    ).resolves.toHaveLength(1)
})

test('style[data-vanilla-style] content', async () => {
    const texts = await savedPage.$$eval('head style[data-vanilla-style]', els =>
        els.map(el => el.innerHTML)
    )
    expect(texts).toEqual([
        expect.stringContaining('.external'),
        expect.stringContaining('.style-tag'),
    ])
})

test('set [src] attribute from dataMap', async () => {
    const src = await savedPage.$eval('img[data-vanilla-src]', img => img.getAttribute('src'))
    const iconBuffer = readFileSync(resolve('src/__tests__/public/icon.png'))

    expect(src).toBe('data:image/png;base64,' + iconBuffer.toString('base64'))
})
