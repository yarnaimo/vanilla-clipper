import { Rarray } from '@yarnaimo/rain'
import csstree from 'css-tree'
import { resolve } from 'url'
import { commentOutError, got } from '.'
import { storeResource } from '../../src/models/resource'
import { Sheet, StyleSheetData } from '../types'
import { dataURLPattern, extractExtensionFromURL } from './file'

const doubleQuote = '"'
const singleQuote = "'"

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

const unescapeURL = (url: string) =>
    url.startsWith(doubleQuote) && url.endsWith(doubleQuote)
        ? url.slice(1, -1).replace(/\\"/g, doubleQuote)
        : url.startsWith(singleQuote) && url.endsWith(singleQuote)
        ? url.slice(1, -1).replace(/\\'/g, singleQuote)
        : url

export async function extractOrFetchCSS(sheetDataList: StyleSheetData[]) {
    const sheets: Sheet[] = await Rarray.waitAll(sheetDataList, async data => {
        try {
            if (data.type === 'error') {
                throw data.error
            }

            if (data.type === 'text') {
                return { text: data.text, url: data.url }
            }

            const { body } = await got.get(data.url)
            return { text: body, url: data.url }
        } catch (_error) {
            return { text: commentOutError(_error), url: data.url }
        }
    })
    return sheets
}

function extractFontsFromValue(value: csstree.Value) {
    const local = [] as csstree.FunctionNode[]
    const remote = [] as RemoteFont[]

    const chunks = value.children.toArray().reduce(
        (array, node) => {
            if (node.type === 'Operator' && node.value === ',') {
                return [...array, []]
            } else {
                array[array.length - 1].push(node)
                return array
            }
        },
        [[]] as csstree.CssNode[][],
    )

    chunks.forEach(chunk => {
        const functionNodes = chunk.filter(
            (node): node is csstree.FunctionNode => node.type === 'Function',
        )
        const localNode = functionNodes.find(node => node.name === 'local')
        const formatNode = functionNodes.find(node => node.name === 'format')
        const urlNode = chunk.find(
            (node): node is csstree.Url =>
                node.type === 'Url' && !dataURLPattern.test(node.value.value),
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

function processSelectorList(prelude: csstree.SelectorList) {
    prelude.children.forEach((node, item, list) => {
        if (node.type === 'Selector') {
            node.children.forEach((node, item, list) => {
                if (node.type === 'Percentage') {
                    throw new Error()
                }

                if (node.type === 'PseudoElementSelector') {
                    list.remove(item)
                }

                if (
                    node.type === 'PseudoClassSelector' &&
                    [
                        'active',
                        'checked',
                        'disabled',
                        'focus',
                        'hover',
                        'link',
                        'required',
                        'visited',
                        'after',
                        'before',
                        'cue',
                        'first-letter',
                        'first-line',
                        'selection',
                        'slotted',
                    ].includes(node.name)
                ) {
                    list.remove(item)
                }
            })

            if (!node.children.getSize()) {
                list.remove(item)
            }
        }
    })
}

async function replaceImports(ast: csstree.CssNode, baseURL: string) {
    let promises: Promise<void>[] = []

    csstree.walk(ast, (node, item, list) => {
        if (
            node.type === 'Atrule' &&
            node.name === 'import' &&
            node.prelude &&
            node.prelude.type === 'AtrulePrelude'
        ) {
            const urlNode = node.prelude.children
                .toArray()
                .find((n): n is csstree.Url => n.type === 'Url')

            if (!urlNode) {
                return
            }

            const url = resolve(baseURL, unescapeURL(urlNode.value.value))

            promises.push(
                (async () => {
                    const { body } = await got.get(url).catch(() => ({ body: '' }))
                    const parsed = csstree.parse(body)

                    if (parsed.type !== 'StyleSheet') {
                        return
                    }

                    await replaceImports(parsed, url)

                    list.replace(item, parsed.children)
                })(),
            )
        }
    })

    await Promise.all(promises)
}

export async function optimizeCSS(
    { text, url: baseURL }: Sheet,
    document?: Document | ShadowRoot,
    noStoring = false,
) {
    const ast = csstree.parse(text)

    await replaceImports(ast, baseURL)

    csstree.walk(ast, (node, item, list) => {
        if (document && node.type === 'Rule' && node.prelude.type === 'SelectorList') {
            const includesURL = (node.block.children.some(node => {
                if (node.type !== 'Declaration' || node.value.type === 'Raw') {
                    return false
                }
                return (node.value.children.some(node => node.type === 'Url') as any) as boolean
            }) as any) as boolean

            if (!includesURL) {
                return
            }

            try {
                const prelude = csstree.clone(node.prelude) as csstree.SelectorList
                processSelectorList(prelude)

                if (!prelude.children.getSize()) {
                    return
                }

                const selector = csstree.generate(prelude)
                const element = document.querySelector(selector)

                if (!element) {
                    list.remove(item)
                }
            } catch (error) {}
        }
    })

    let promises: Promise<void>[] = []

    csstree.walk(ast, node => {
        if (node.type === 'Atrule' && node.name === 'font-face' && node.block) {
            const base = [] as csstree.CssNode[]
            const local = [] as csstree.FunctionNode[]
            const remote = [] as RemoteFont[]

            node.block.children.toArray().forEach(line => {
                if (
                    line.type === 'Declaration' &&
                    line.property === 'src' &&
                    line.value.type === 'Value'
                ) {
                    const fonts = extractFontsFromValue(line.value)

                    local.push(...fonts.local)
                    remote.push(...fonts.remote)
                } else {
                    base.push(line)
                }
            })

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
                if (list.getSize()) {
                    list.appendData({ type: 'Operator', value: ',' })
                }

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

        if (node.type === 'Url') {
            const { value: url } = node.value

            const relativeURL = unescapeURL(url)

            if (dataURLPattern.test(relativeURL) || noStoring) {
                return
            }

            promises.push(
                (async () => {
                    const version = await storeResource(baseURL, relativeURL)
                    if (!version) {
                        return
                    }

                    node.value.value = version.url
                })(),
            )
        }
    })

    await Promise.all(promises)

    const generated = csstree.generate(ast)
    return generated
}
