import { Browser, launch, LaunchOptions } from 'puppeteer-core'
import { findChrome, noSandboxArgs, sig } from '../utils'
import { VPage } from './VPage'
const puppeteer = require(process.env.NODE_ENV === 'test' ? 'puppeteer' : 'puppeteer-core')

export class VBrowser {
    static async launch(noSandbox = false, options: LaunchOptions = {}) {
        const executablePath = findChrome()
        const browser = await (puppeteer.launch as typeof launch)({
            ignoreHTTPSErrors: true,
            executablePath,
            ...options,
            args: [...(options.args || []), ...(noSandbox ? noSandboxArgs : [])],
        })
        sig.info(`Using ${executablePath}`)
        if (options.userDataDir) sig.info(`User Data Directory: ${options.userDataDir}`)

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
