import { dayjs, t } from 'bluespark'
import { firestore } from 'firebase-admin'
import tldjs from 'tldjs'
import { Article } from '../../../web/src/models/article'
import { BrowserTask } from '../../../web/src/models/browserTask'
import { PR } from '../types'
import { db } from '../utils/firebase'
import { getVPage, VPage } from './VPage'

export const toDocData = (
    results: PR<ReturnType<typeof VPage>['save']>[],
    compact = false,
) => {
    const firstResult = results[0]
    const { hostname, domain } = tldjs.parse(firstResult.url)

    const docBase = {
        createdAt: firestore.FieldValue.serverTimestamp(),
        publishedAt: firstResult.mercury.date_published
            ? dayjs(firstResult.mercury.date_published)
            : null,

        url: firstResult.url,
        hostname,
        domain,

        texts: results.map(r => r.mercury.content),
        author: firstResult.mercury.author,
        leadImageDownloadUrl: firstResult.mercury.lead_image_url,

        title: firstResult.mercury.title,
        excerpts: results.map(r => r.mercury.excerpt),
    }

    if (compact) {
        return {
            ...docBase,
            type: 'webpageCompact' as const,
        }
    } else {
        return {
            ...docBase,
            type: 'webpage' as const,
            downloadUrls: results.map(r => r.path!),
        }
    }
}

export const savePage = async (
    id: string,
    {
        launchOptions,
        request: { urls, accountLabel, ...options },
    }: t.TypeOf<typeof BrowserTask.codec>,
) => {
    const vPage = await getVPage(launchOptions)

    const results = await urls.reduce(async (promise, url) => {
        const prev = await promise

        await vPage.goto(url, accountLabel)
        const result = await vPage.save(options)

        return [...prev, result]
    }, Promise.resolve([] as PR<typeof vPage.save>[]))

    const docData = toDocData(results, options.compact)

    const doc = Article.within(db).doc(id)
    await Article(doc).set(docData)

    return { doc, docData }
}
