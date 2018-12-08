import { writeFileSync } from 'fs'
import { DateTime } from 'luxon'
import { join } from 'path'
import yargs from 'yargs'
import { VBrowser, VPage } from '..'
import { filenamifyUrl, sig } from '../utils'

const main = async () => {
    const { _: urls, ns, directory } = yargs
        .option('ns', {
            boolean: true,
            desc: 'Launch Puppeteer with "--no-sandbox --disable-setuid-sandbox" args',
        })
        .option('directory', {
            alias: 'd',
            default: '.',
            desc: 'Output directory',
        })
        .demandCommand(1).argv

    const dateString = DateTime.local().toFormat('yyyyMMdd')

    const vBrowser = await VBrowser.launch(ns)

    const successCount = await urls.reduce(async (prevPromise, url, i) => {
        const _successCount = await prevPromise
        const outputPath = join(directory, `${dateString}-${filenamifyUrl(url)}.html`)
        sig.await('[%d/%d] Cilpping %s', i + 1, urls.length, url)

        let vPage: VPage | undefined
        try {
            vPage = await vBrowser.newPage(url)
            const { html } = await vPage.clip()

            writeFileSync(outputPath, html)
            sig.success('Saved as %s', outputPath)
            return _successCount + 1
        } catch (error) {
            sig.error(error)
            return _successCount
        } finally {
            if (vPage) await vPage.close()
        }
    }, Promise.resolve(0))

    if (successCount) sig.complete('Clipped %d page%s', successCount, successCount === 1 ? '' : 's')

    await vBrowser.close()
}

main().catch(error => sig.error(error))
