import { left, right } from 'fp-ts/lib/Either'
const Mercury = require('@postlight/mercury-parser')

export interface MercuryResult {
    title: string
    content: string
    author: string | null
    date_published: string | null
    lead_image_url: string | null
    dek: string | null
    next_page_url: string | null
    url: string | null
    domain: string | null
    excerpt: string | null
    word_count: number
    direction: string | null
    total_pages: number
    rendered_pages: number
}

async function parse(url: string, html: string) {
    const result = Mercury.parse(url, {
        html,
        contentType: 'text',
        fetchAllPages: false,
    }) as MercuryResult

    if (!result.content) {
        return left<Error, MercuryResult>(new Error('Parse error'))
    }

    return right<Error, MercuryResult>(result)
}

export const mercury = { parse }
