#!/usr/bin/env node
import yargs from 'yargs'
import { VBrowser } from '..'
import { devices, sig } from '../utils'
import { outputPathFn } from '../utils/file'

export const clip = async () => {
    type Options = {
        _: string[]
        verbose: boolean
        noSandbox: boolean
        headless: boolean
        language?: string
        directory: string
        accountLabel: string
        device?: string
        userDataDir?: string
        element?: string
        click?: string
        scroll?: string
        maxScrolls: number
    }

    const options = (yargs
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
            default: 'main',
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
        .demandCommand(1).argv as any) as Options

    const {
        _: urls,
        verbose,
        noSandbox,
        headless,
        language,
        directory,
        accountLabel,
        device: deviceName,
        userDataDir,
        element,
        click,
        scroll,
        maxScrolls,
    } = options

    try {
        const device = devices[deviceName as string]
        const outputPath = outputPathFn(directory)

        await VBrowser.clipPages(
            {
                verbose,
                noSandbox: noSandbox,
                headless,
                language,
                device,
                userDataDir: userDataDir,
            },
            urls.map(url => ({
                url,
                accountLabel,
                outputPath,
                element,
                click,
                scroll,
                maxScrolls,
            }))
        )
    } catch (error) {
        sig.error(error)
    } finally {
        process.exit(0)
    }
}

clip()
