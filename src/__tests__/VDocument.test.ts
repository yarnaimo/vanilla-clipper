import { Page } from 'puppeteer'
import { VBrowser } from '..'
import { VDocument } from '../core/VDocument'
import { VPage } from '../core/VPage'
import { launch, servedFileURL } from './utils'

let vDocument: VDocument
let vBrowser: VBrowser
let page: Page

beforeAll(async () => {
    vBrowser = await launch()
    page = (await vBrowser.newPage()).frame
})

afterAll(async () => {
    await vBrowser.close()
})

beforeEach(async () => {
    await page.goto(servedFileURL('page.html'))
    vDocument = await VDocument.create(new VPage(page), () => document)
})

test('#getSheetDataList()', async () => {
    const result = await vDocument.getSheetDataList()
    expect(result).toEqual([
        { link: servedFileURL('main.css') },
        { text: expect.stringMatching(/\.style-tag/) },
    ])
})

test('#setUuidToIFrames()', async () => {
    await vDocument.setUuidToIFrames()
    const uuids = await page.$$eval('iframe', els =>
        els.map(el => (el as HTMLElement).dataset.vanillaClipperIframeUuid)
    )
    expect(uuids).toHaveLength(1)
    expect(uuids[0]).toHaveLength(36)
})
