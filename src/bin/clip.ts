#!/usr/bin/env node
import { outputFile } from 'fs-extra'
import { DateTime } from 'luxon'
import yargs from 'yargs'
import { devices, filenamifyUrl, VBrowser } from '..'
import { newFilePath, sig } from '../utils'

export const clip = async () => {
    const {
        _: urls,
        verbose,
        noSandbox,
        headless,
        language,
        directory,
        accountLabel,
        device: deviceName,
        element,
        click,
        scroll,
        maxScrolls,
        userDataDir,
    } = yargs
        .option('verbose', {
            alias: 'v',
            type: 'boolean',
            desc: 'Verbose',
        })
        .option('no-sandbox', {
            alias: 'n',
            type: 'boolean',
            desc: 'Launch Puppeteer with "--no-sandbox --disable-setuid-sandbox" args',
        })
        .option('headless', {
            alias: 'h',
            type: 'boolean',
            default: true,
            desc: 'Headless mode',
        })
        .option('language', {
            alias: 'l',
            type: 'string',
            desc: 'Browser language',
        })
        .option('directory', {
            alias: 'd',
            type: 'string',
            default: '.',
            desc: 'Output directory',
        })
        .option('account-label', {
            alias: 'a',
            type: 'string',
            default: 'default',
            desc: 'Account label',
        })
        .option('device', {
            type: 'string',
            desc: 'Emulate a device (Defined in `puppeteer-core/DeviceDescriptors`)',
        })
        .option('element', {
            alias: 'e',
            type: 'string',
            desc: 'Selector for target element (The layout may collapse)',
        })
        .option('click', {
            alias: 'c',
            type: 'string',
            desc: 'Selector for elements to click',
        })
        .option('scroll', {
            alias: 's',
            type: 'string',
            desc: 'Selector for element to scroll (to the bottom)',
        })
        .option('max-scrolls', {
            alias: 'x',
            type: 'number',
            default: 10,
            desc: 'Maximum number of scrolls',
        })
        .option('user-data-dir', {
            alias: 'u',
            type: 'string',
            desc: 'Path to a User Data Directory',
        })
        .demandCommand(1).argv

    try {
        const dateString = DateTime.local().toFormat('yyyyMMdd')
        const device = devices[deviceName]

        const vBrowser = await VBrowser.launch(
            noSandbox,
            { userDataDir, headless, dumpio: verbose },
            language
        )
        const vPage = await vBrowser.newPage({ device })

        const successCount = await urls.reduce(async (prevPromise, url, i) => {
            const _successCount = await prevPromise
            sig.pending('[%d/%d] Cilpping %s', i + 1, urls.length, url)

            try {
                await vPage.login(url, accountLabel)
                await vPage.goto(url)
                const { html } = await vPage.clip({ element, click, scroll, maxScrolls })

                const basename = `${dateString}-${filenamifyUrl(url)}`
                const outputPath = await newFilePath(directory, basename)

                await outputFile(outputPath, html)
                sig.success('Saved as %s', outputPath)
                return _successCount + 1
            } catch (error) {
                sig.error(error)
                return _successCount
            }
        }, Promise.resolve(0))

        await vPage.close()

        if (successCount)
            sig.complete('Clipped %d page%s', successCount, successCount === 1 ? '' : 's')

        await vBrowser.close()
    } catch (error) {
        sig.error(error)
    } finally {
        process.exit(0)
    }
}

clip()
