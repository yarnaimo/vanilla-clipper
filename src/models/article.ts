import { blue, DayjsFromFirestoreTimestamp, FieldValue, t } from 'bluespark'
import { stringOrNull } from '../types'

const Base = t.type({
    type: t.string,

    createdAt: t.union([DayjsFromFirestoreTimestamp, FieldValue]),
    publishedAt: t.union([DayjsFromFirestoreTimestamp, t.null]),

    url: t.string,
    hostname: stringOrNull,
    domain: stringOrNull,

    texts: t.array(t.string),
    author: stringOrNull,
    leadImageDownloadUrl: stringOrNull,
})

const WebpageCompact = t.type({
    ...Base.props,
    type: t.literal('webpageCompact'),

    title: t.string,
    excerpts: t.union([t.array(t.union([t.string, t.null])), t.null]),
})

const Webpage = t.type({
    ...WebpageCompact.props,
    type: t.literal('webpage'),

    downloadUrls: t.array(t.string),
})

const TweetCompact = t.type({
    ...Base.props,
    type: t.literal('tweetCompact'),

    publishedAt: DayjsFromFirestoreTimestamp,
    tweetId: t.string,
    retweetCount: t.number,
    favCount: t.number,
    imageDownloadUrls: t.array(t.string),

    userId: t.string,
    author: t.string,
    leadImageDownloadUrl: t.string,
})

const ArticleCodec = t.partial({
    ...WebpageCompact.props,
    ...Webpage.props,
    ...TweetCompact.props,
    ...Base.props,
})

export const Article = blue('articles', ArticleCodec, [WebpageCompact, Webpage, TweetCompact])
