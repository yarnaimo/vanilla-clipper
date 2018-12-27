import csstree from 'css-tree'
import { resolve } from 'url'
import { extractExtensionFromURL } from '.'
import { dataURLPattern } from './data'

export const cssURLPattern = /([:,\s]\s*url)\s*\((?!\s*data:.+,)\s*(\S+?)\s*\)/gi

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

    const local = [] as csstree.FunctionNode[]
    const remote = [] as RemoteFont[]

    chunks.forEach(chunk => {
        const functionNodes = chunk.filter(
            (node): node is csstree.FunctionNode => node.type === 'Function'
        )
        const localNode = functionNodes.find(node => node.name === 'local')
        const formatNode = functionNodes.find(node => node.name === 'format')
        const urlNode = chunk.find(
            (node): node is csstree.Url =>
                node.type === 'Url' && !dataURLPattern.test(node.value.value)
        )

        if (localNode) {
            local.push(localNode)
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

export function optimizeCSS(text: string, currentURL: string) {
    const doubleQuote = '"'
    const singleQuote = "'"

    const urls = new Set<string>()
    const ast = csstree.parse(text)

    csstree.walk(ast, node => {
        if (node.type === 'Url') {
            const { value } = node.value

            const relativeURL =
                value.startsWith(doubleQuote) && value.endsWith(doubleQuote)
                    ? value.slice(1, -1).replace(/\\"/g, doubleQuote)
                    : value.startsWith(singleQuote) && value.endsWith(singleQuote)
                    ? value.slice(1, -1).replace(/\\'/g, singleQuote)
                    : value

            const absoluteURL = resolve(currentURL, relativeURL)
            node.value.value = absoluteURL
        }
    })

    csstree.walk(ast, node => {
        if (node.type === 'Url') {
            const { value } = node.value

            if (!dataURLPattern.test(value)) {
                urls.add(value)
            }
            return
        }

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
                    base: [] as csstree.CssNode[],
                    local: [] as csstree.FunctionNode[],
                    remote: [] as RemoteFont[],
                }
            )

            const optimalRemote = remote.sort((a, b) => {
                return (
                    (fontFormatNames.indexOf(a.formatName) + 1 || 9) -
                    (fontFormatNames.indexOf(b.formatName) + 1 || 9)
                )
            })[0] as RemoteFont | undefined

            const optimalRemoteNodes: csstree.CssNode[] = optimalRemote
                ? [
                      {
                          type: 'Url',
                          value: { type: 'Raw', value: optimalRemote.path },
                      },
                      { type: 'WhiteSpace', value: ' ' },
                      {
                          type: 'Function',
                          name: 'format',
                          children: new csstree.List<csstree.CssNode>().fromArray([
                              { type: 'String', value: `'${optimalRemote.formatName}'` },
                          ]),
                      },
                  ]
                : []

            const chunks = [...local.map(l => [l]), optimalRemoteNodes]

            const children = chunks.reduce((list, chunk) => {
                if (list.getSize()) list.appendData({ type: 'Operator', value: ',' })

                chunk.forEach(node => list.appendData(node))
                return list
            }, new csstree.List<csstree.CssNode>())

            node.block.children.fromArray([
                {
                    type: 'Declaration',
                    property: 'src',
                    important: false,
                    value: { type: 'Value', children },
                },
                ...base,
            ])
        }
    })

    return { text: csstree.generate(ast), urls }
}
