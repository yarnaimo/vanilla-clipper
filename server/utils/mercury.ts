import { is } from '@yarnaimo/rain'
import 'fp-ts/lib/Either'
import { TryAsync } from 'trysafe'
import { Omit } from 'type-fest'
const Mercury = require('@postlight/mercury-parser')

type MercuryResult = {
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

export type VMercuryResult = Omit<MercuryResult, 'url' | 'domain'>

async function parse(url: string, html: string) {
    return TryAsync(async () => {
        const result = (await Mercury.parse(url, {
            html: Buffer.from(html),
            contentType: 'markdown',
            fetchAllPages: false,
        })) as MercuryResult

        if (is.nullish(result.title)) {
            throw new Error('Failed to parse with mercury parser')
        }

        delete result.url
        delete result.domain

        return result as VMercuryResult
    })
}

export const mercury = { parse }
