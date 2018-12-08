import { Browser, launch, LaunchOptions } from 'puppeteer'
import { noSandboxArgs } from '../utils'
import { VPage } from './VPage'

export class VBrowser {
    static async launch(noSandbox = false, options: LaunchOptions = {}) {
        const browser = await launch({
            ...options,
            args: [...(options.args || []), ...(noSandbox ? noSandboxArgs : [])],
        })
        return new VBrowser(browser)
    }

    private constructor(public browser: Browser) {}

    async newPage(url?: string) {
        const page = await this.browser.newPage()
        if (url) await page.goto(url, { waitUntil: 'networkidle0' })

        return VPage.create(page)
    }

    async close() {
        await this.browser.close()
    }
}
