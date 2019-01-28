import { Page } from 'puppeteer'
import { VBrowser } from '..'
import { VDocument } from '../core/VDocument'
import { VPage } from '../core/VPage'
import { launch, servedFileURL } from './utils'

let vDocument: VDocument
let vBrowser: VBrowser
let vPage: VPage
let page: Page

beforeAll(async () => {
    vBrowser = await launch()
    vPage = await vBrowser.newPage()
    page = vPage.frame
})

afterAll(async () => {
    await vBrowser.close()
})

beforeEach(async () => {
    await page.goto(servedFileURL('page.html'))
    vDocument = await VDocument.create(vPage, () => document)
})

test('#getSheetDataList()', async () => {
    const result = await vDocument.getSheetDataList()
    expect(result).toEqual([
        { type: 'link', url: servedFileURL('main.css') },
        { type: 'text', url: servedFileURL('page'), text: expect.stringMatching(/\.style-tag/) },
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
