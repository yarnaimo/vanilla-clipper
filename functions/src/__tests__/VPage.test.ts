import { Frame, Page } from 'puppeteer'
import { getVPage, VPage } from '../core/VPage'
import { PR } from '../types'
import { buildVAttrSelector } from '../utils/element'
import { launch, servedFileURL } from './utils'

let result: PR<ReturnType<typeof VPage>['save']>
let savedPage: Page
let childFrame: Frame

launch()

beforeAll(async () => {
    const vPage = await getVPage({})
    await vPage.frame.goto(servedFileURL('page.html'))

    result = await vPage.save({})
    await vPage.frame.browser().close()
})

beforeAll(async () => {
    const savedVPage = await getVPage({}, true)
    savedPage = savedVPage.frame

    await savedPage.goto(servedFileURL(result.path!))
    childFrame = savedPage.frames()[1]
})

afterAll(async () => {
    await savedPage.browser().close()
})

// test('resource db', async () => {
//     const file = await readFile(resourceDBPath, 'utf8')

//     expect(JSON.parse(file)).toEqual({
//         'http:!!localhost:3000!icon.png': {
//             url: 'http://localhost:3000/icon.png',
//             versions: [
//                 expect.objectContaining({
//                     createdAt: expect.stringMatching(/^\d{4}-/),
//                     hash: expect.stringMatching(/^.{64}$/),
//                     path: expect.stringMatching(/^\d{8}\/.{26}\.png$/),
//                 }),
//             ],
//         },
//     })
// })

// test('metadata', async () => {
//     expect(metadata).toMatchObject({
//         _version: 1,
//         domain: 'localhost',
//         hostname: 'localhost',
//         url: servedFileURL('page'),
//         title: 'Vanilla Test',
//     })
// })

test('element count', async () => {
    await expect(
        savedPage.$$(`link[rel=stylesheet], [src]:not(${buildVAttrSelector.src()}):not(a)`),
    ).resolves.toHaveLength(0)

    await expect(savedPage.$$(`head style${buildVAttrSelector.style()}`)).resolves.toHaveLength(2)
    await expect(savedPage.$$(`head script${buildVAttrSelector.script()}`)).resolves.toHaveLength(1)
    await expect(
        savedPage.$$(`body img${buildVAttrSelector.src(servedFileURL('icon.png'))}`),
    ).resolves.toHaveLength(1)
})

test('style[data-vanilla-clipper-style] content', async () => {
    const texts = await savedPage.$$eval(`head style${buildVAttrSelector.style()}`, els =>
        els.map(el => el.innerHTML),
    )
    expect(texts).toEqual([
        expect.stringContaining('.external'),
        expect.stringContaining('.style-tag'),
    ])
})

test('[src] attribute', async () => {
    const src = await savedPage.$eval(`img${buildVAttrSelector.src()}`, img =>
        img.getAttribute('src'),
    )
    expect(src).toMatch(/\.\.\/resources\/[\w-]+\.png/)
})

test('iframe - element count', async () => {
    await expect(
        childFrame.$$(`link[rel=stylesheet], [src]:not(${buildVAttrSelector.src()}):not(a)`),
    ).resolves.toHaveLength(0)

    await expect(childFrame.$$(`head style${buildVAttrSelector.style()}`)).resolves.toHaveLength(2)
    await expect(childFrame.$$(`head script${buildVAttrSelector.script()}`)).resolves.toHaveLength(
        1,
    )
    await expect(
        childFrame.$$(`body img${buildVAttrSelector.src(servedFileURL('icon.png'))}`),
    ).resolves.toHaveLength(1)
})
