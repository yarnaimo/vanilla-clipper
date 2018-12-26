import { Rstring } from '@yarnaimo/rain'
import csstree from 'css-tree'
import { extractExtensionFromURL } from '.'

export const cssURLPattern = /([:,\s]\s*url)\s*\((?!\s*['"]?data:.+,)\s*['"]?(\S+?)['"]?\s*\)/gi

export function extractURLsFromCSSTexts(cssTexts: string[]) {
    return cssTexts.reduce((urls, text) => {
        Rstring.globalMatch(text, cssURLPattern).forEach(match => urls.add(match[2]))
        return urls
    }, new Set<string>())
}

const fontFormats = {
    woff2: 'woff2',
    woff: 'woff',
    ttf: 'truetype',
    otf: 'opentype',
}

const fontFormatNames = Object.values(fontFormats)

interface RemoteFont {
    path: string
    formatName: string
}

function extractFontsFromValue(value: csstree.Value) {
    const chunks = value.children.toArray().reduce(
        (array, node) => {
            if (node.type === 'Operator' && node.value === ',') {
                return [...array, []]
            } else {
                array[array.length - 1].push(node)
                return array
            }
        },
        [[]] as csstree.CssNode[][]
    )

    const local = [] as string[]
    const remote = [] as RemoteFont[]

    chunks.forEach(chunk => {
        const functionNodes = chunk.filter(
            (node): node is csstree.FunctionNode => node.type === 'Function'
        )
        const localNode = functionNodes.find(node => node.name === 'local')
        const formatNode = functionNodes.find(node => node.name === 'format')
        const urlNode = chunk.find(
            (node): node is csstree.Url => node.type === 'Url' && !/data:.+,/.test(node.value.value)
        )

        if (localNode) {
            const data = localNode.children.first()

            if (data && data.type === 'String') {
                local.push(`local(${data.value})`)
            }
            return
        }

        let formatName: string | undefined
        if (formatNode) {
            const data = formatNode.children.first()

            if (data && data.type === 'String') {
                const _formatName = data.value.replace(/['"]/g, '')

                if (fontFormatNames.includes(_formatName)) {
                    formatName = _formatName
                }
            }
        } else if (urlNode) {
            const ext = extractExtensionFromURL(urlNode.value.value)
            if (ext && ext in fontFormats) {
                formatName = fontFormats[ext as keyof typeof fontFormats]
            }
        }

        if (urlNode && formatName) {
            remote.push({ path: urlNode.value.value, formatName })
        }
    })

    return { local, remote }
}

export function optimizeCSS(text: string) {
    const ast = csstree.parse(text)

    csstree.walk(ast, node => {
        if (node.type === 'Atrule' && node.name === 'font-face' && node.block) {
            const { base, local, remote } = node.block.children.toArray().reduce(
                ({ base, local, remote }, line) => {
                    if (
                        line.type === 'Declaration' &&
                        line.property === 'src' &&
                        line.value.type === 'Value'
                    ) {
                        const fonts = extractFontsFromValue(line.value)

                        return {
                            base,
                            local: [...local, ...fonts.local],
                            remote: [...remote, ...fonts.remote],
                        }
                    } else {
                        return { base: [...base, line], local, remote }
                    }
                },
                {
                    base: [] as (csstree.CssNode)[],
                    local: [] as string[],
                    remote: [] as RemoteFont[],
                }
            )

            const filteredRemotes = remote
                .sort((a, b) => {
                    return (
                        (fontFormatNames.indexOf(a.formatName) + 1 || 9) -
                        (fontFormatNames.indexOf(b.formatName) + 1 || 9)
                    )
                })
                .filter((_, i) => i === 0)
                .map(r => `url(${r.path}) format('${r.formatName}')`)

            node.block.children.fromArray([
                ...base,
                csstree.fromPlainObject({
                    type: 'Declaration',
                    property: 'src',
                    important: false,
                    value: { type: 'Raw', value: [...local, ...filteredRemotes].join(',') },
                }),
            ])
        }
    })

    return csstree.generate(ast)

    // const parsed = css.parse(text, { silent: true })
    // if (!parsed.stylesheet) return ''

    // const optimizedRules = parsed.stylesheet.rules
    //     .filter(rule => rule.type !== 'rule' || isNot.undefined((rule as any).declarations))
    //     .map(rule => {
    //         const filteredRemotes = remote
    //             .sort((a, b) => {
    //                 return (
    //                     (fontFormatNames.indexOf(a.formatName) + 1 || 9) -
    //                     (fontFormatNames.indexOf(b.formatName) + 1 || 9)
    //                 )
    //             })
    //             .filter((_, i) => i === 0)
    //             .map(r => `url('${r.path.replace(/'/g, "\\'")}') format('${r.formatName}')`)

    //         return {
    //             ...rule,
    //             declarations: [
    //                 ...base,
    //                 {
    //                     type: 'declaration',
    //                     property: 'src',
    //                     value: [...local, ...filteredRemotes].join(', '),
    //                 },
    //             ],
    //         }
    //     })

    // return css.stringify({ ...parsed, stylesheet: { ...parsed.stylesheet, rules: optimizedRules } })
}
