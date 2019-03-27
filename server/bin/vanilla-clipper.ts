#!/usr/bin/env node
import { Command, flags } from '@oclif/command'
import { VBrowser } from '..'
import { devices } from '../utils'

class VanillaClipper extends Command {
    static strict = false

    static flags = {
        version: flags.version(),
        help: flags.help(),

        verbose: flags.boolean({
            char: 'v',
            description: 'Verbose',
        }),
        noSandbox: flags.boolean({
            char: 'n',
            description: 'Launch Puppeteer with --no-sandbox and --disable-setuid-sandbox args',
        }),
        headless: flags.boolean({
            char: 'h',
            description: 'Headless mode',
            default: true,
        }),
        language: flags.string({
            char: 'l',
            description: 'Browser language',
        }),
        device: flags.string({
            description: 'Device name to emulate (Defined in `puppeteer-core/DeviceDescriptors`)',
        }),
        userDataDir: flags.string({
            char: 'u',
            description: 'Path to User Data Directory',
        }),

        accountLabel: flags.string({
            char: 'a',
            description: 'Account label',
            default: 'default',
        }),
        onlyIndex: flags.boolean({
            char: 'i',
            description: 'Save only search index without saving the file',
        }),
        element: flags.string({
            char: 'e',
            description: 'Selector for the target element (The layout may collapse)',
        }),
        click: flags.string({
            char: 'c',
            description: 'Selector for the elements to click',
        }),
        scroll: flags.string({
            char: 's',
            description: 'Selector for the element to scroll to the bottom',
        }),
        maxScrolls: flags.integer({
            char: 'x',
            description: 'Maximum number of scrolls',
            default: 10,
        }),
    }

    async run() {
        const { argv: urls, flags } = this.parse(VanillaClipper)

        const {
            verbose,
            noSandbox,
            headless,
            language,
            device: deviceName,
            userDataDir,
            accountLabel,
            onlyIndex,
            element,
            click,
            scroll,
            maxScrolls,
        } = flags

        const device = devices[deviceName as string]

        await VBrowser.clipPages(
            {
                verbose,
                noSandbox,
                headless,
                language,
                device,
                userDataDir,
            },
            urls.map(url => ({
                url,
                accountLabel,
                onlyIndex,
                element,
                click,
                scroll,
                maxScrolls,
            })),
        )
    }
}

VanillaClipper.run()
