import { Page, Viewport } from 'puppeteer-core'
import { VBrowser } from '..'
import { config } from '../config-store'
import { VFrame } from './VFrame'

export class VPage extends VFrame {
    isRoot = true

    initialViewport: Viewport

    constructor(public vBrowser: VBrowser, public frame: Page) {
        super(vBrowser, frame)
        this.initialViewport = this.frame.viewport()
    }

    async setViewportHeight(height: number) {
        this.frame.setViewport({ ...this.initialViewport, height })
    }

    async resetViewport() {
        this.frame.setViewport(this.initialViewport)
    }

    async close() {
        return this.frame.close()
    }

    async goto(url: string) {
        const site = config.sites.findSite(url)
        if (site && site.userAgent) {
            await this.frame.setUserAgent(site.userAgent)
        } else {
            await this.frame.setUserAgent(await this.vBrowser.browser.userAgent())
        }
        await this.frame.goto('about:blank', { waitUntil: 'networkidle2' })
        await this.frame.waitFor(500)
        await this.frame.goto(url, { waitUntil: 'networkidle2' })
        await this.frame.waitFor(3000)
    }

    async login(url: string, label: string) {
        const site = config.sites.findSite(url)
        if (!site) return

        await config.sites.login(site, this, label)
    }
}
