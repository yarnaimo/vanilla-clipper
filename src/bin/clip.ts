import { outputFile } from 'fs-extra'
import { DateTime } from 'luxon'
import { join } from 'path'
import yargs from 'yargs'
import { VBrowser } from '..'
import { filenamifyUrl, sig } from '../utils'

export const clip = async () => {
    const { _: urls, noSandbox, directory, accountLabel, userDataDir, headless } = yargs
        .option('no-sandbox', {
            alias: 'n',
            boolean: true,
            desc: 'Launch Puppeteer with "--no-sandbox --disable-setuid-sandbox" args',
        })
        .option('headless', {
            alias: 'h',
            boolean: true,
            default: true,
            desc: 'Headless mode',
        })
        .option('directory', {
            alias: 'd',
            string: true,
            default: '.',
            desc: 'Output directory',
        })
        .option('account-label', {
            alias: 'a',
            string: true,
            default: 'default',
            desc: 'Account label',
        })
        .option('user-data-dir', {
            alias: 'u',
            string: true,
            desc: 'Path to a User Data Directory',
        })
        .demandCommand(1).argv

    try {
        const dateString = DateTime.local().toFormat('yyyyMMdd')

        const vBrowser = await VBrowser.launch(noSandbox, { userDataDir, headless })
        const vPage = await vBrowser.newPage()

        const successCount = await urls.reduce(async (prevPromise, url, i) => {
            const _successCount = await prevPromise
            const outputPath = join(directory, `${dateString}-${filenamifyUrl(url)}.html`)
            sig.pending('[%d/%d] Cilpping %s', i + 1, urls.length, url)

            // let vPage: VPage | undefined
            try {
                // vPage = await vBrowser.newPage(url, accountLabel)
                await vPage.login(url, accountLabel)
                await vPage.goto(url)
                const { html } = await vPage.clip()

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
