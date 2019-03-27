import { Either, left, right } from 'fp-ts/lib/Either'
import { DateTime } from 'luxon'
import { parse } from 'tldjs'
import { Merge } from 'type-fest'
import { now } from '../../server/utils'
import { mercury, VMercuryResult } from '../../server/utils/mercury'
import { VPouchdb } from '../pouchdb'

export type PageDoc = Merge<
    VMercuryResult,
    {
        _id: string
        filename: string | null
        created_at: string
        url: string
        hostname: string | null
        domain: string | null
    }
>

export const pages = VPouchdb<PageDoc>('pages')

export async function createPageDoc({
    _id,
    url,
    html,
    filename,
    createdAt,
}: {
    _id: string
    url: string
    html: string
    filename: string | null
    createdAt?: DateTime
}): Promise<Either<Error, PageDoc>> {
    const { hostname, domain } = parse(url)

    const metadata = await mercury.parse(url, html)
    if (metadata.isLeft()) {
        return left(metadata.value)
    }

    const doc = {
        _id,
        filename,
        created_at: createdAt ? createdAt.toISO() : now(),
        url,
        hostname,
        domain,
        ...metadata.value,
    }
    await pages.post(doc)

    return right(doc)
}
