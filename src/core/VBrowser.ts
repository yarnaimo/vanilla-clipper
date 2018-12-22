import { isNot } from '@yarnaimo/rain'
import { ensureDir } from 'fs-extra'
import { Browser, launch, LaunchOptions } from 'puppeteer-core'
import { config } from '../config'
import { findChrome, noSandboxArgs, sig } from '../utils'
import { VPage } from './VPage'
const isTest = process.env.NODE_ENV === 'test'
const puppeteer = require(isTest ? 'puppeteer' : 'puppeteer-core')

export class VBrowser {
    static async launch(noSandbox = false, options: LaunchOptions = {}) {
        let executablePath: string | undefined
        let userDataDir: string | undefined

        if (isNot.undefined(options.executablePath)) {
            executablePath = options.executablePath
            sig.info('Using %s', executablePath)
        } else {
            executablePath = findChrome()
        }

        if (options.userDataDir) {
            userDataDir = options.userDataDir
            ensureDir(userDataDir)
            sig.info('User Data Directory: %s', userDataDir)
        }

        const browser = await (puppeteer.launch as typeof launch)({
            ignoreHTTPSErrors: true,
            executablePath,
            userDataDir,
            ...options,
            args: [...(options.args || []), ...(noSandbox ? noSandboxArgs : [])],
        })

        return new VBrowser(browser)
    }

    private constructor(public browser: Browser) {}

    async login(vPage: VPage, url: string, label?: string) {
        const site = config.sites.findSite(url)
        if (!site) return []

        // const vPage = new VPage(await this.browser.newPage())
        const cookies = await config.sites.login(site, vPage, label)
        // await vPage.close()
        return cookies
    }

    async newPage(url?: string, label?: string) {
        const vPage = new VPage(await this.browser.newPage())
        if (url) {
            const cookies = await this.login(vPage, url, label)
            await vPage.goto(url)
            // await vPage.page.setCookie(...cookies)
            // await vPage.page.reload()
        }
        return vPage
    }

    async close() {
        await this.browser.close()
    }
}
