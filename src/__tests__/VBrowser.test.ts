import { VBrowser } from '../core/VBrowser'
import { VPage } from '../core/VPage'

let vBrowser: VBrowser

beforeAll(async () => {
    vBrowser = await VBrowser.launch(true, { executablePath: undefined })
})

afterAll(async () => {
    await vBrowser.close()
})

test('#browser', async () => {
    expect(await vBrowser.browser.pages).toHaveLength(0)
})

test('#newPage()', async () => {
    const vPage = await vBrowser.newPage()
    expect(vPage).toBeInstanceOf(VPage)
})
