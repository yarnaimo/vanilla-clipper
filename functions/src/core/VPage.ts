import { t } from '@yarnaimo/rain'
import puppeteer, { Page } from 'puppeteer'
import { ulid } from 'ulid'
import {
    ClipRequest,
    VLaunchOptions,
} from '../../../web/src/models/browserTask'
import { config } from '../config-store'
import { bucket } from '../utils/firebase'
import { parseMercury } from '../utils/mercury'
import { VFrame } from './VFrame'

const vPageInstances = new Map<string, ReturnType<typeof VPage>>()

export const getVPage = async (
    {
        dumpio = false,
        headless = true,
        lang = 'ja',
        device,
    }: t.TypeOf<typeof VLaunchOptions>,
    forceNew = false,
) => {
    const key = JSON.stringify({ dumpio, headless, lang, device })

    let vPage = vPageInstances.get(key)
    if (vPage && !forceNew) {
        return vPage
    }

    const args = ['--no-sandbox', `--lang=${lang}`]

    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        dumpio,
        headless,
        args,
    })

    vPage = VPage(await browser.newPage(), await browser.userAgent())

    vPageInstances.set(key, vPage)

    await vPage.frame.setCacheEnabled(false)

    if (device) {
        await vPage.frame.emulate(device)
    }

    return vPage
}

export const VPage = (frame: Page, defaultUserAgent: string) => ({
    ...VFrame(frame, true),

    defaultUserAgent,

    async save(options: t.TypeOf<typeof ClipRequest>) {
        const { url, html } = await this._clip(options)

        const mercury = (await parseMercury(url, html)).getOrElseL(e => {
            throw e
        })

        if (options.compact) {
            return { url, html, mercury }
        } else {
            const id = ulid()
            const path = `pages/${id}.html`

            const file = bucket.file(path)
            await file.save(html, {
                gzip: true,
                metadata: { contentType: 'text/html' },
            })

            return { url, html, mercury, path }
        }
    },

    async close() {
        return this.frame.close()
    },

    async goto(url: string, label: string = 'default') {
        const site = config.findSite(url)

        if (site) {
            await site.login(this, label)
        }

        if (site && site.userAgent) {
            await this.frame.setUserAgent(site.userAgent)
        } else {
            await this.frame.setUserAgent(this.defaultUserAgent)
        }

        await this.frame.goto('about:blank', { waitUntil: 'networkidle2' })
        await this.frame.waitFor(500)
        await this.frame.goto(url, { waitUntil: 'networkidle2' })
        await this.frame.waitFor(3000)
    },
})
