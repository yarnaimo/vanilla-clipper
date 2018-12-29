import { Page } from 'puppeteer-core'
import { config } from '../config-store'
import { VFrame } from './VFrame'

export class VPage extends VFrame {
    isRoot = true

    constructor(public frame: Page) {
        super(frame)
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
