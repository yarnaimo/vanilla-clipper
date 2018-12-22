import { Rarray, Rstring } from '@yarnaimo/rain'
import { minify } from 'html-minifier'
import { ElementHandle } from 'puppeteer'
import { resolve } from 'url'
import { VFrame, VMetadata } from '..'
import { DataListItem, StyleSheetData } from '../types'
import { commentOutError, css, got } from '../utils'

export function generateFullHTML({
    doctype = '',
    html,
    vMetadata,
    minify: shouldMinify,
}: {
    doctype?: string
    html: string
    vMetadata?: VMetadata
    minify: boolean
}) {
    const fullHTML = vMetadata
        ? `${doctype}
<!--Clipped with vanilla-clipper-->
<!--vanilla-clipper-metadata: ${vMetadata.stringify()}-->
${html}`
        : html

    return shouldMinify ? minify(fullHTML, { minifyJS: true, minifyCSS: true }) : fullHTML
}

export function extractVanillaMetadata(fullHTML: string) {
    const m = fullHTML.match(/^<!--vanilla-clipper-metadata: ({\n[\s\S]+?\n})-->/)
    if (!m) return null

    return m && m[1]
}

export const cssURLPattern = /([:,\s]\s*url)\s*\((?!\s*['"]?data:.+,)\s*['"]?(\S+?)['"]?\s*\)/gi

export function extractURLsInCSSText(cssTexts: string[]) {
    return cssTexts.reduce((urls, text) => {
        Rstring.globalMatch(text, cssURLPattern).forEach(match => urls.add(match[2]))
        return urls
    }, new Set<string>())
}

export async function extractOrFetchCSSText(sheetDataList: StyleSheetData[]) {
    return await Rarray.waitAll(sheetDataList, async ({ link, text, error }) => {
        try {
            if (error) throw error
            if (text) return text

            const { body } = await got.get(link!)
            return body
        } catch (_error) {
            return commentOutError(_error)
        }
    })
}

export function extractExtension(url: string) {
    const m = url.match(/[^?#]+\.(\w+)(?:$|\?|#)/)
    return m ? m[1] : null
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

function extractFontsFromValue(value: string) {
    return value
        .split(',')
        .map(value => value.trim())
        .reduce(
            ({ local, remote }, value) => {
                if (value.startsWith('local')) {
                    return { local: [...local, value], remote }
                }

                const f = /format\s*\(\s*['"]?(.+?)['"]?\s*\)/i.exec(value)
                const matchedFormatName = f && f[1]
                const u = /url\s*\((?!\s*['"]?data:.+,)\s*['"]?(\S+?)['"]?\s*\)/i.exec(value)
                const matchedURL = u && u[1]

                let formatName: string | undefined

                if (matchedFormatName) {
                    if (fontFormatNames.includes(matchedFormatName)) {
                        formatName = matchedFormatName
                    }
                } else if (matchedURL) {
                    const ext = extractExtension(matchedURL)
                    if (ext && ext in fontFormats) {
                        formatName = fontFormats[ext as keyof typeof fontFormats]
                    }
                }

                if (!matchedURL || !formatName) {
                    return { local, remote }
                }

                return {
                    local,
                    remote: [...remote, { path: matchedURL, formatName }],
                }
            },
            { local: [] as string[], remote: [] as RemoteFont[] }
        )
}

export function optimizeCSS(text: string) {
    interface Declaration {
        property: string
        value: string
    }

    function isFontFace(rule: css.Rule): rule is css.FontFace {
        return rule.type === 'font-face'
    }

    const parsed = css.parse(text)
    if (!parsed.stylesheet) return ''

    const optimizedRules = parsed.stylesheet.rules.map(rule => {
        if (!isFontFace(rule)) return rule

        const { base, local, remote } = (rule.declarations || []).reduce(
            ({ base, local, remote }, decl: any) => {
                if (decl.property !== 'src') return { base: [...base, decl], local, remote }

                const fonts = extractFontsFromValue((decl as Declaration).value)
                return {
                    base,
                    local: [...local, ...fonts.local],
                    remote: [...remote, ...fonts.remote],
                }
            },
            {
                base: [] as (css.Comment | css.Declaration)[],
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
            .map(r => `url('${r.path.replace(/'/g, "\\'")}') format('${r.formatName}')`)

        return {
            ...rule,
            declarations: [
                ...base,
                {
                    type: 'declaration',
                    property: 'src',
                    value: [...local, ...filteredRemotes].join(', '),
                },
            ],
        }
    })

    return css.stringify({ ...parsed, stylesheet: { ...parsed.stylesheet, rules: optimizedRules } })
}

export async function getHTMLStringOfIFrame(iframeHandles: ElementHandle[]) {
    return Rarray.waitAll(iframeHandles, async handle => {
        const frame = await handle.contentFrame()
        const vFrame = new VFrame(frame!)
        const { html } = await vFrame.clip({ isRoot: false }).catch(() => ({ html: '' }))
        return html
    })
}

export async function dataSourceUrlsToDataList(dataSourceUrls: Set<string>[], currentURL: string) {
    const urls = dataSourceUrls.reduce((prev, current) => [...prev, ...current], [] as string[])

    return Rarray.waitAll<string, DataListItem>(urls, async url => {
        const dataURL = await getDataURL(url, currentURL)
        return [url, dataURL]
    })
}

export function dataListToScriptString(dataList: DataListItem[], cssTexts: string[]) {
    return `{
        const dataMap = new Map(${JSON.stringify(dataList)})

        const styleElements = ${JSON.stringify(cssTexts)}
            .map(text =>
                text.replace(
                    ${cssURLPattern.toString()},
                    (_, prefix, url) => \`\${prefix}('\${dataMap.get(url)}')\`
                )
            )
            .map(text => {
                const el = document.createElement('style')
                el.dataset.vanillaClipperStyle = ''
                el.innerHTML = text
                return el
            })

        document.head.append(...styleElements)

        document.addEventListener('DOMContentLoaded', () => {
            const elements = document.querySelectorAll('[data-vanilla-clipper-src], [data-vanilla-clipper-href]')
            elements.forEach(el => {
                const { vanillaClipperSrc, vanillaClipperHref } = el.dataset
                const src = dataMap.get(vanillaClipperSrc)
                const href = dataMap.get(vanillaClipperHref)

                if (src) el.setAttribute('src', src)
                if (href) el.setAttribute('href', href)
            })
        })
    }`
}

export async function getDataURL(url: string, currentURL: string) {
    try {
        const {
            body,
            headers: { 'content-type': mimetype },
        } = await got.get(currentURL ? resolve(currentURL, url) : url, { encoding: null })

        return `data:${mimetype};base64,${body.toString('base64')}`
    } catch (error) {
        return `data:text/css,${commentOutError(error)}`
    }
}
