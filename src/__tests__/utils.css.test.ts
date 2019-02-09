import CleanCSS from 'clean-css'
import csstree from 'css-tree'
import { readFileSync } from 'fs-extra'
import { JSDOM } from 'jsdom'
import { extractOrFetchCSS, optimizeCSS } from '../utils/css'
import { publicFilePath, servedFileURL } from './utils'

const cleanCSS = new CleanCSS()
const minify = (text: string) => cleanCSS.minify(text).styles

const iconURL = servedFileURL('icon.png')
const cssURL = servedFileURL('main.css')
const iconBuffer = readFileSync(publicFilePath('icon.png'))
const iconDataURL = `data:image/png;base64,${iconBuffer.toString('base64')}`
const cssFileText = readFileSync(publicFilePath('main.css'), 'utf8')

describe('optimizeCSS()', () => {
    const { window } = new JSDOM()

    test('extract woff2 and local', async () => {
        const optimized = await optimizeCSS(
            {
                text: `@font-face {
                    font-family: 'Awesome Font';
                    src: url(/fonts/awesome.woff) format('woff');
                    src:
                        url(/fonts/awesome.otf) format('opentype'),
                        local('Awesome Font'),
                        url(/fonts/awesome.woff2) format('woff2'),
                        url(/fonts/awesome.eot) format('embedded-opentype');
                }`,
                url: '',
            },
            window.document,
            true
        )

        const fontURL = '/fonts/awesome.woff2'

        expect(optimized).toEqual(
            csstree.generate(
                csstree.parse(`@font-face {
                    src:
                        local('Awesome Font'),
                        url(${fontURL}) format('woff2');
                    font-family: 'Awesome Font';
                }`)
            )
        )
    })

    test('extract woff - without quotes and format name', async () => {
        const fontURL = '/fonts/awesome.woff'

        expect(
            await optimizeCSS(
                {
                    text: `@font-face {
                        font-family: 'Awesome Font';
                        src:
                            url(/fonts/awesome.otf) format('opentype'),
                            url(/fonts/awesome.woff),
                            url(/fonts/awesome.eot) format('embedded-opentype');
                    }`,
                    url: '',
                },
                window.document,
                true
            )
        ).toEqual(
            csstree.generate(
                csstree.parse(`@font-face {
                    src: url(${fontURL}) format('woff');
                    font-family: 'Awesome Font';
                }`)
            )
        )
    })
})

test('extractOrFetchCSSText()', async () => {
    const text = '.text { opacity: 1; }'
    const sheets = await extractOrFetchCSS([
        { type: 'text', url: servedFileURL(''), text },
        { type: 'link', url: cssURL },
    ])

    expect(sheets).toEqual([
        { text: text, url: servedFileURL('') },
        { text: cssFileText, url: cssURL },
    ])
})
