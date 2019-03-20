import { readFile } from 'fs-extra'
import { Frame, Page } from 'puppeteer-core'
import { VBrowser } from '../core/VBrowser'
import { IMetadata } from '../types'
import { buildVAttrSelector } from '../utils/element'
import { launch, removeResources, resourceDBPath, servedFileURL } from './utils'

let vBrowser: VBrowser
let metadata: IMetadata
let html: string
let savedPage: Page
let childFrame: Frame

beforeAll(async () => {
    await removeResources()

    vBrowser = await launch()
    const vPage = await vBrowser.newPage()
    await vPage.goto(servedFileURL('page.html'))

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
    await removeResources()
    await vBrowser.close()
    done()
})

test('resource db', async () => {
    const file = await readFile(resourceDBPath, 'utf8')

    expect(JSON.parse(file)).toEqual({
        'http:!!localhost:3000!icon.png': {
            url: 'http://localhost:3000/icon.png',
            versions: [
                expect.objectContaining({
                    createdAt: expect.stringMatching(/^\d{4}-/),
                    hash: expect.stringMatching(/^.{64}$/),
                    path: expect.stringMatching(/^\d{8}\/.{26}\.png$/),
                }),
            ],
        },
    })
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
        savedPage.$$(`link[rel=stylesheet], [src]:not(${buildVAttrSelector.src()}):not(a)`)
    ).resolves.toHaveLength(0)

    await expect(savedPage.$$(`head style${buildVAttrSelector.style()}`)).resolves.toHaveLength(2)
    await expect(savedPage.$$(`head script${buildVAttrSelector.script()}`)).resolves.toHaveLength(1)
    await expect(
        savedPage.$$(`body img${buildVAttrSelector.src(servedFileURL('icon.png'))}`)
    ).resolves.toHaveLength(1)
})

test('style[data-vanilla-clipper-style] content', async () => {
    const texts = await savedPage.$$eval(`head style${buildVAttrSelector.style()}`, els =>
        els.map(el => el.innerHTML)
    )
    expect(texts).toEqual([
        expect.stringContaining('.external'),
        expect.stringContaining('.style-tag'),
    ])
})

test('[src] attribute', async () => {
    const src = await savedPage.$eval(`img${buildVAttrSelector.src()}`, img =>
        img.getAttribute('src')
    )
    expect(src).toMatch(/\.\.\/resources\/\d{8}\/.{26}\.png/)
})

test('iframe - element count', async () => {
    await expect(
        childFrame.$$(`link[rel=stylesheet], [src]:not(${buildVAttrSelector.src()}):not(a)`)
    ).resolves.toHaveLength(0)

    await expect(childFrame.$$(`head style${buildVAttrSelector.style()}`)).resolves.toHaveLength(2)
    await expect(childFrame.$$(`head script${buildVAttrSelector.script()}`)).resolves.toHaveLength(
        1
    )
    await expect(
        childFrame.$$(`body img${buildVAttrSelector.src(servedFileURL('icon.png'))}`)
    ).resolves.toHaveLength(1)
})
