import { minify } from 'html-minifier'
import { VMetadata } from '..'

export function generateFullHTML({
    doctype = '',
    document,
    vMetadata,
    minify: shouldMinify,
}: {
    doctype?: string
    document: Document
    vMetadata?: VMetadata
    minify: boolean
}) {
    if (vMetadata) {
        const meta = document.createElement('meta')
        meta.name = 'vanilla-clipper'
        meta.content = vMetadata.stringify()
        document.head.prepend(meta)
    }
    const fullHTML = `${doctype}\n${document.documentElement.outerHTML}`

    return shouldMinify ? minify(fullHTML, { minifyJS: true, minifyCSS: true }) : fullHTML
}

export function extractVanillaMetadata(fullHTML: string) {
    const m = fullHTML.match(/<!--vanilla-clipper-metadata: ({\n[\s\S]+?\n})-->/)
    if (!m) return null

    return m && m[1]
}
