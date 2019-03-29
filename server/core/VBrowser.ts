import { is } from '@yarnaimo/rain'
import { Either, isLeft } from 'fp-ts/lib/Either'
import { ensureDir } from 'fs-extra'
import { Browser, EmulateOptions, launch, LaunchOptions } from 'puppeteer-core'
import { TryAsync } from 'trysafe'
import { PageDoc } from '../../src/models/page'
import { findChrome, noSandboxArgs, sig } from '../utils'
import { VPage } from './VPage'
const isTest = process.env.NODE_ENV === 'test'
const puppeteer = require(isTest ? 'puppeteer' : 'puppeteer-core')

export type VLaunchOptions = {
    verbose?: boolean
    noSandbox?: boolean
    headless?: boolean
    language?: string
    device?: EmulateOptions
    userDataDir?: string
}

export type ClipRequest = {
    accountLabel?: string
    onlyIndex?: boolean
    element?: string
    click?: string
    scroll?: string
    maxScrolls?: number
}

export type ClipRequestWithURL = ClipRequest & {
    url: string
}

export class VBrowser {
    static async clipPages(
        {
            verbose = false,
            noSandbox = false,
            headless = true,
            language,
            device,
            userDataDir,
        }: VLaunchOptions,
        requests: ClipRequestWithURL[],
    ): Promise<Either<{ url: string }, PageDoc>[]> {
        const vBrowser = await VBrowser.launch(
            noSandbox,
            { userDataDir, headless, dumpio: verbose },
            language,
        )
        const vPage = await vBrowser.newPage(device)

        const results = [] as Either<{ url: string }, PageDoc>[]

        for (const [i, { url, accountLabel, ...options }] of requests.entries()) {
            console.log()
            sig.pending('[%d/%d] Clipping %s', i + 1, requests.length, url)

            const result = await TryAsync(async () => {
                await vPage.goto(url, accountLabel)

                const result = await vPage.clip(options)
                if (result.isLeft()) {
                    throw result.value
                }
                return result.value
            })

            results.push(result.mapLeft(l => ({ url })))

            if (result.isLeft()) {
                sig.error(result.value)
                continue
            }

            sig.success('Saved as %s', `${result.value._id}.html`)
        }

        await vPage.close()
        await vBrowser.close()

        console.log()
        sig.info('Results --------------------------------')

        const succeededCount = results.filter(r => r.isRight()).length
        if (succeededCount) {
            sig.complete('Clipped %d page%s', succeededCount, succeededCount === 1 ? '' : 's')
        }

        results.filter(isLeft).forEach(result => sig.error('Failed to clip %s', result.value.url))

        return results
    }

    static async launch(
        noSandbox = false,
        { args = [], ...options }: LaunchOptions = {},
        lang?: string,
    ) {
        if (lang) {
            args.push(`--lang=${lang}`)
        }
        let executablePath: string | undefined
        let userDataDir: string | undefined

        if (!is.undefined(options.executablePath)) {
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

    async newPage(device?: EmulateOptions) {
        const vPage = new VPage(this, await this.browser.newPage())
        await vPage.frame.setCacheEnabled(false)

        if (device) {
            await vPage.frame.emulate(device)
        }

        return vPage
    }

    async close() {
        await this.browser.close()
    }
}
