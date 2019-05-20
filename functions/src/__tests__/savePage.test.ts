import { dayjs } from 'bluespark'
import { firestore } from 'firebase-admin'
import { toDocData } from '../core/savePage'

test('toDocData', () => {
    const url = 'https://a.example.com/b'
    const html = ''
    const date = '2019-01-17T00:17:00+0900'
    const imageUrl = 'https://example.com/image.png'
    const title = 'Vanilla Test'
    const mercuries = [
        {
            author: 'author',
            content: 'content1',
            date_published: date,
            dek: null,
            direction: 'ltr',
            domain: '',
            excerpt: 'excerpt1',
            lead_image_url: imageUrl,
            next_page_url: null,
            rendered_pages: 1,
            title,
            total_pages: 1,
            url: '',
            word_count: 1,
        },
        {
            author: '',
            content: 'content2',
            date_published: '',
            dek: null,
            direction: 'ltr',
            domain: '',
            excerpt: 'excerpt2',
            lead_image_url: '',
            next_page_url: null,
            rendered_pages: 1,
            title: '',
            total_pages: 1,
            url: '',
            word_count: 1,
        },
    ]
    expect(
        toDocData([
            { url, html, mercury: mercuries[0], path: 'path1' },
            { url, html, mercury: mercuries[1], path: 'path2' },
        ]),
    ).toEqual({
        createdAt: expect.any(firestore.FieldValue),
        publishedAt: dayjs(date),
        url,
        hostname: 'a.example.com',
        domain: 'example.com',
        texts: ['content1', 'content2'],
        author: 'author',
        leadImageDownloadUrl: imageUrl,
        title,
        excerpts: ['excerpt1', 'excerpt2'],
        type: 'webpage',
        downloadUrls: ['path1', 'path2'],
    })
    expect(
        toDocData(
            [{ url, html, mercury: mercuries[0] }, { url, html, mercury: mercuries[1] }],
            true,
        ),
    ).toEqual({
        createdAt: expect.any(firestore.FieldValue),
        publishedAt: dayjs(date),
        url,
        hostname: 'a.example.com',
        domain: 'example.com',
        texts: ['content1', 'content2'],
        author: 'author',
        leadImageDownloadUrl: imageUrl,
        title,
        excerpts: ['excerpt1', 'excerpt2'],
        type: 'webpageCompact',
    })
})
