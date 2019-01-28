import { Frame, Page } from 'puppeteer-core'
import { VBrowser } from '../core/VBrowser'
import { VMetadata } from '../core/VMetadata'
import { getVAttrSelector } from '../utils/element'
import { launch, servedFileURL } from './utils'

let vBrowser: VBrowser
let metadata: VMetadata
let html: string
let savedPage: Page
let childFrame: Frame

beforeAll(async () => {
    vBrowser = await launch()
    const vPage = await vBrowser.newPage({ url: servedFileURL('page.html') })
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
        url: servedFileURL('page'),
        title: 'Vanilla Test',
    })
})

test('element count', async () => {
    await expect(
        savedPage.$$(`link[rel=stylesheet], [src]:not(${getVAttrSelector.src()}):not(a)`)
    ).resolves.toHaveLength(0)

    await expect(savedPage.$$(`head style${getVAttrSelector.style()}`)).resolves.toHaveLength(2)
    await expect(savedPage.$$(`head script${getVAttrSelector.script()}`)).resolves.toHaveLength(1)
    await expect(
        savedPage.$$(`body img${getVAttrSelector.src(servedFileURL('icon.png'))}`)
    ).resolves.toHaveLength(1)
})

test('style[data-vanilla-clipper-style] content', async () => {
    const texts = await savedPage.$$eval(`head style${getVAttrSelector.style()}`, els =>
        els.map(el => el.innerHTML)
    )
    expect(texts).toEqual([
        expect.stringContaining('.external'),
        expect.stringContaining('.style-tag'),
    ])
})

test('[src] attribute from dataList', async () => {
    const src = await savedPage.$eval(`img${getVAttrSelector.src()}`, img =>
        img.getAttribute('src')
    )
    expect(src).toMatch('blob:null/')
})

test('iframe - element count', async () => {
    await expect(
        childFrame.$$(`link[rel=stylesheet], [src]:not(${getVAttrSelector.src()}):not(a)`)
    ).resolves.toHaveLength(0)

    await expect(childFrame.$$(`head style${getVAttrSelector.style()}`)).resolves.toHaveLength(2)
    await expect(childFrame.$$(`head script${getVAttrSelector.script()}`)).resolves.toHaveLength(1)
    await expect(
        childFrame.$$(`body img${getVAttrSelector.src(servedFileURL('icon.png'))}`)
    ).resolves.toHaveLength(1)
})
