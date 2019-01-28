import { isNot } from '@yarnaimo/rain'
import { ensureDir } from 'fs-extra'
import { Browser, EmulateOptions, launch, LaunchOptions } from 'puppeteer-core'
import { config } from '../config-store'
import { findChrome, noSandboxArgs, sig } from '../utils'
import { VPage } from './VPage'
const isTest = process.env.NODE_ENV === 'test'
const puppeteer = require(isTest ? 'puppeteer' : 'puppeteer-core')

export class VBrowser {
    static async launch(
        noSandbox = false,
        { args = [], ...options }: LaunchOptions = {},
        lang?: string
    ) {
        if (lang) args.push(`--lang=${lang}`)
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
            args: [...args, ...(noSandbox ? noSandboxArgs : [])],
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

    async newPage({
        url,
        label,
        device,
    }: { url?: string; label?: string; device?: EmulateOptions } = {}) {
        const vPage = new VPage(this, await this.browser.newPage())
        await vPage.frame.setCacheEnabled(false)

        if (device) await vPage.frame.emulate(device)
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
