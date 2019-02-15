import { is } from '@yarnaimo/rain'
import { ensureDir, outputFile } from 'fs-extra'
import { Browser, EmulateOptions, launch, LaunchOptions } from 'puppeteer-core'
import { IMetadata } from '../types'
import { findChrome, noSandboxArgs, sig } from '../utils'
import { VPage } from './VPage'
const isTest = process.env.NODE_ENV === 'test'
const puppeteer = require(isTest ? 'puppeteer' : 'puppeteer-core')

export type ClipOptions = {
    element?: string
    click?: string
    scroll?: string
    maxScrolls?: number
}

export type ClipOptionsWithURL = ClipOptions & {
    url: string
    accountLabel?: string
    outputPath: string | ((metadata: IMetadata) => Promise<string>)
}

export class VBrowser {
    static async clipPages(
        {
            verbose,
            noSandbox,
            headless,
            language,
            device,
            userDataDir,
        }: {
            verbose?: boolean
            noSandbox?: boolean
            headless?: boolean
            language?: string
            device?: EmulateOptions
            userDataDir?: string
        },
        list: ClipOptionsWithURL[]
    ) {
        const vBrowser = await VBrowser.launch(
            noSandbox,
            { userDataDir, headless, dumpio: verbose },
            language
        )
        const vPage = await vBrowser.newPage(device)

        const successCount = await list.reduce(
            async (prevPromise, { url, accountLabel, outputPath, ...options }, i) => {
                const _successCount = await prevPromise

                sig.pending('[%d/%d] Cilpping %s', i + 1, list.length, url)

                try {
                    await vPage.goto(url, accountLabel)
                    const { html, metadata } = await vPage.clip(options)

                    const _outputPath = is.string(outputPath)
                        ? outputPath
                        : await outputPath(metadata!)

                    await outputFile(_outputPath, html)
                    sig.success('Saved as %s', _outputPath)

                    return _successCount + 1
                } catch (error) {
                    sig.error(error)
                    return _successCount
                }
            },
            Promise.resolve(0)
        )

        await vPage.close()

        if (successCount) {
            sig.complete('Clipped %d page%s', successCount, successCount === 1 ? '' : 's')
        }

        await vBrowser.close()
    }

    static async launch(
        noSandbox = false,
        { args = [], ...options }: LaunchOptions = {},
        lang?: string
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
