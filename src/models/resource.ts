import { DateTime } from 'luxon'
import 'mime-types'
import { extension } from 'mime-types'
import { TryAsync } from 'trysafe'
import { ulid } from 'ulid'
import { resolve as resolveURL } from 'url'
import { config } from '../../server/config-store'
import { got, now, sig } from '../../server/utils'
import { dataURLToBuffer, getHash, resourcesDirectory } from '../../server/utils/file'
import { VPouchdb } from '../pouchdb'

export type ResourceDoc = {
    url: string
    created_at: string
    hash: string
    path: string
}

export const resources = VPouchdb<ResourceDoc>('resources')

const promise = resources.createIndex({
    index: { fields: ['url', 'created_at'] },
})

function withRelativeURL(version?: { path: string }) {
    if (!version) {
        return
    }
    return { version, url: `../../resources/${version.path}` }
}

async function createVersion({
    url,
    buffer,
    hash,
    mimetype,
}: {
    url: string
    buffer: Buffer
    hash?: string
    mimetype?: string
}) {
    const outputDir = DateTime.local().toFormat('yyyyMMdd')

    const id = ulid()
    const ext = mimetype && extension(mimetype)
    const filename = ext ? `${id}.${ext}` : id
    const path = `${outputDir}/${filename}`

    await resourcesDirectory.file(path).write(buffer)

    if (hash) {
        const doc: ResourceDoc = {
            url,
            created_at: now(),
            hash,
            path,
        }

        await resources.post(doc)
        return doc
    }

    return { path }
}

async function getVersions(url: string) {
    await promise

    const result = await resources.find({
        selector: {
            url,
        },
    })

    const versions = result.docs.sort((a, b) => {
        if (a.created_at > b.created_at) {
            return 1
        }
        if (a.created_at < b.created_at) {
            return -1
        }
        return 0
    })

    return {
        versions,

        recentVersion() {
            const last = versions[versions.length - 1] as ResourceDoc | undefined

            if (last && -1 < DateTime.fromISO(last.created_at).diffNow('hours').hours) {
                return last
            }
        },
    }
}

export async function storeResource(
    baseUrl: string,
    originalUrl: string,
    storedDataUrlOrFileUrl?: string,
) {
    const bufferFromoriginalDataUrl = dataURLToBuffer(originalUrl)

    if (bufferFromoriginalDataUrl) {
        const version = await createVersion({ ...bufferFromoriginalDataUrl, url: originalUrl })
        return withRelativeURL(version)
    }

    const url = resolveURL(baseUrl, originalUrl)

    const resource = await getVersions(url)
    const recentVersion = resource.recentVersion()

    if (recentVersion) {
        return withRelativeURL(recentVersion)
    }

    const result = await TryAsync(async () => {
        const response = await (async () => {
            if (storedDataUrlOrFileUrl) {
                const bufferFromStoredDataUrl = dataURLToBuffer(storedDataUrlOrFileUrl)

                if (bufferFromStoredDataUrl) {
                    return bufferFromStoredDataUrl
                }
            }

            const storedFileUrl = storedDataUrlOrFileUrl

            const {
                headers: { 'content-type': mimetype, 'content-length': size },
            } = await got.head(storedFileUrl || url)

            if (size && parseInt(size) > config.resource.maxSize) {
                return
            }

            const { body } = await got.get(storedFileUrl || url, { encoding: null })

            if (body.length > config.resource.maxSize) {
                return
            }

            return { buffer: body, mimetype }
        })()

        if (!response) {
            return
        }

        const hash = getHash(response.buffer)
        const matchedVersion = resource.versions.find(v => v.hash === hash)

        if (matchedVersion) {
            return withRelativeURL(matchedVersion)
        }

        return withRelativeURL(
            await createVersion({
                url,
                buffer: response.buffer,
                hash,
                mimetype: response.mimetype,
            }),
        )
    })

    if (result.isLeft()) {
        sig.warn(result.value)
        return
    }

    return result.value
}
