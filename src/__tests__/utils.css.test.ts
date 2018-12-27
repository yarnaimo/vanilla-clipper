import csstree from 'css-tree'
import { optimizeCSS } from '../utils/css'
import { servedFileURL } from './utils'

describe('optimizeCSS()', () => {
    test('extract woff2 and local', () => {
        const fontURL = servedFileURL('fonts/awesome.woff2')

        expect(
            optimizeCSS(
                `@font-face {
                    font-family: 'Awesome Font';
                    src: url('/fonts/awesome.woff') format('woff');
                    src:
                        url('/fonts/awesome.otf') format('opentype'),
                        local('Awesome Font'),
                        url('/fonts/awesome.woff2') format('woff2'),
                        url('/fonts/awesome.eot') format('embedded-opentype');
                }`,
                servedFileURL('')
            )
        ).toEqual({
            text: csstree.generate(
                csstree.parse(`@font-face {
                    src:
                        local('Awesome Font'),
                        url(${fontURL}) format('woff2');
                    font-family: 'Awesome Font';
                }`)
            ),
            urls: new Set([fontURL]),
        })
    })

    test('extract woff - without quotes and format name', () => {
        const fontURL = servedFileURL('fonts/awesome.woff')

        expect(
            optimizeCSS(
                `@font-face {
                    font-family: 'Awesome Font';
                    src:
                        url('/fonts/awesome.otf') format('opentype'),
                        url(/fonts/awesome.woff),
                        url('/fonts/awesome.eot') format('embedded-opentype');
                }`,
                servedFileURL('')
            )
        ).toEqual({
            text: csstree.generate(
                csstree.parse(`@font-face {
                    src: url(${servedFileURL('fonts/awesome.woff')}) format('woff');
                    font-family: 'Awesome Font';
                }`)
            ),
            urls: new Set([fontURL]),
        })
    })
})
