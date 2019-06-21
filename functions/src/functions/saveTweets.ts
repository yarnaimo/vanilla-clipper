import { Article } from '../../../web/src/models/article'
import { db, getRegion } from '../utils/firebase'

export const saveTweets = getRegion().https.onRequest(async (req, res) => {
    const doc = Article.within(db).doc()
    Article(doc).set({
        type: 'tweetCompact',

        createdAt: t.union([DayjsFromFirestoreTimestamp, FieldValue]),
        publishedAt: t.union([DayjsFromFirestoreTimestamp, t.null]),

        url: 'https',
        hostname: stringOrNull,
        domain: stringOrNull,

        texts: t.array(t.string),
        author: stringOrNull,
        leadImageDownloadUrl: stringOrNull,

        publishedAt: DayjsFromFirestoreTimestamp,
        tweetId: t.string,
        retweetCount: t.number,
        favCount: t.number,
        imageDownloadUrls: t.array(t.string),

        userId: t.string,
        author: t.string,
        leadImageDownloadUrl: t.string,
    })
})
