import { VDocument } from '../core/VDocument'
import { getVPage } from '../core/VPage'
import { PR } from '../types'
import { launch, servedFileURL } from './utils'

let vDocument: PR<typeof VDocument>
let vPage: PR<typeof getVPage>

launch()

beforeAll(async () => {
    vPage = await getVPage({})
})

afterAll(async done => {
    vPage.frame
        .browser()
        .close()
        .then(done)
})

beforeEach(async () => {
    await vPage.frame.goto(servedFileURL('page.html'))
    vDocument = await VDocument(vPage.frame, () => document)
})

test('#getSheetDataList()', async () => {
    const result = await vDocument.getSheetDataList()
    expect(result).toEqual([
        { type: 'link', url: servedFileURL('main.css') },
        {
            type: 'text',
            url: servedFileURL('page.html'),
            text: expect.stringMatching(/\.style-tag/),
        },
    ])
})

test('#setUuidToIFrames()', async () => {
    await vDocument.setUuidToIFramesAndShadowHosts()
    const uuids = await vPage.frame.$$eval('iframe', els =>
        els.map(el => (el as HTMLElement).dataset.vanillaClipperIframeUuid),
    )
    expect(uuids).toHaveLength(1)
    expect(uuids[0]).toHaveLength(36)
})
