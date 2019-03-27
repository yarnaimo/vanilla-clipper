import 'fp-ts/lib/Either'
import { Either, left } from 'fp-ts/lib/Either'
import { Page, Viewport } from 'puppeteer-core'
import { TryAsync } from 'trysafe'
import { ulid } from 'ulid'
import { VBrowser } from '..'
import { createPageDoc, PageDoc } from '../../src/models/page'
import { config } from '../config-store'
import { pagesMainDirectory } from '../utils/file'
import { ClipRequest } from './VBrowser'
import { VFrame } from './VFrame'

export class VPage extends VFrame {
    isRoot = true

    initialViewport: Viewport

    constructor(public vBrowser: VBrowser, public frame: Page) {
        super(vBrowser, frame)
        this.initialViewport = this.frame.viewport()
    }

    async clip(options: ClipRequest = {}): Promise<Either<Error, PageDoc>> {
        const _id = ulid()
        const result = await TryAsync(() => this._clip(options))
        if (result.isLeft()) {
            return left(result.value)
        }

        const { url, html, createdAt } = result.value

        let filename: string | null = null

        if (!options.onlyIndex) {
            filename = `${_id}.html`
            await pagesMainDirectory.file(filename).write(html)
        }

        return await createPageDoc({ _id, url, html, filename, createdAt })
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

    async goto(url: string, label: string = 'default') {
        const site = config.sites.findSite(url)

        if (site) {
            await config.sites.login(site, this, label)
        }

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
}
