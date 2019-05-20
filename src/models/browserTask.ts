import { blue, DayjsFromFirestoreTimestamp, FieldValue, t, tr } from 'bluespark'

export const VLaunchOptions = t.partial({
    dumpio: t.boolean,
    headless: t.boolean,
    lang: t.string,
    device: t.any,
})

export const ClipRequest = t.partial({
    accountLabel: t.string,
    compact: t.boolean,
    element: t.string,
    click: t.string,
    scroll: t.string,
    maxScrolls: t.number,
})

export const ClipRequestWithURLs = t.intersection([
    ClipRequest,
    t.type({
        urls: tr.nonEmptyArray(t.string),
    }),
])

export const browserTask = blue(
    'browserTasks',
    t.type({
        createdAt: t.union([DayjsFromFirestoreTimestamp, FieldValue]),
        status: t.keyof({
            waiting: null,
            processing: null,
            done: null,
            failed: null,
        }),
        launchOptions: VLaunchOptions,
        request: ClipRequestWithURLs,
    }),
)
