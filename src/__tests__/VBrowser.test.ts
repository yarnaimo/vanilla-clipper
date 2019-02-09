import { VBrowser } from '../core/VBrowser'
import { VPage } from '../core/VPage'
import { launch } from './utils'

let vBrowser: VBrowser

beforeAll(async () => {
    vBrowser = await launch()
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
