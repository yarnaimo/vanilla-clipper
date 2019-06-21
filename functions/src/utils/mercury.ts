import { t } from 'bluespark'
import { stringOrNull } from '../../../web/src/models/types'
const Mercury = require('@postlight/mercury-parser')

export const MercuryResult = t.type({
    title: t.string,
    content: t.string,
    author: stringOrNull,
    date_published: stringOrNull,
    lead_image_url: stringOrNull,
    dek: stringOrNull,
    next_page_url: stringOrNull,

    url: stringOrNull,
    domain: stringOrNull,

    excerpt: stringOrNull,
    word_count: t.number,
    direction: stringOrNull,
    total_pages: t.number,
    rendered_pages: t.number,
})

export const parseMercury = async (url: string, html: string) => {
    const result = await Mercury.parse(url, {
        html: Buffer.from(html),
        contentType: 'markdown',
        fetchAllPages: false,
    })

    return MercuryResult.decode(result)
}
