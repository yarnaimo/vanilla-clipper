import { minify } from 'html-minifier'
import { VMetadata } from '..'

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
