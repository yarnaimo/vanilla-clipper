import csstree from 'css-tree'
import { optimizeCSS } from '../utils/css'

describe('optimizeCSS()', () => {
    test('extract woff2 and local', () => {
        expect(
            optimizeCSS(`@font-face {
                font-family: 'Awesome Font';
                src: url('/fonts/awesome.woff') format('woff');
                src:
                    url('/fonts/awesome.otf') format('opentype'),
                    local('Awesome Font'),
                    url('/fonts/awesome.woff2') format('woff2'),
                    url('/fonts/awesome.eot') format('embedded-opentype');
            }`)
        ).toBe(
            csstree.generate(
                csstree.parse(`@font-face {
                    font-family: 'Awesome Font';
                    src: local('Awesome Font'), url('/fonts/awesome.woff2') format('woff2');
                }`)
            )
        )
    })

    test('extract woff - without quotes and format name', () => {
        expect(
            optimizeCSS(`@font-face {
                font-family: 'Awesome Font';
                src:
                    url('/fonts/awesome.otf') format('opentype'),
                    url(/fonts/awesome.woff),
                    url('/fonts/awesome.eot') format('embedded-opentype');
            }`)
        ).toBe(
            csstree.generate(
                csstree.parse(`@font-face {
                    font-family: 'Awesome Font';
                    src: url(/fonts/awesome.woff) format('woff');
                }`)
            )
        )
    })
})
