import { Page } from 'puppeteer-core'
import { config } from '../config'
import { VFrame } from './VFrame'

export class VPage extends VFrame {
    constructor(public frame: Page, public url: string = 'about:blank') {
        super(frame, url)
    }

    async close() {
        return this.frame.close()
    }

    async goto(url: string) {
        await this.frame.goto(url, { waitUntil: 'networkidle2' })
        await this.frame.waitFor(2000)
    }

    async login(url: string, label: string) {
        const site = config.sites.findSite(url)
        if (!site) return

        await config.sites.login(site, this, label)
    }
}
