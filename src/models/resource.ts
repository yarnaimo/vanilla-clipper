import { DateTime } from 'luxon'
import 'mime-types'
import { extension } from 'mime-types'
import { TryAsync } from 'trysafe'
import { ulid } from 'ulid'
import { config } from '../../server/config-store'
import { got, now, sig } from '../../server/utils'
import { getHash, resourcesDirectory } from '../../server/utils/file'
import { VPouchdb } from '../pouchdb'

export type ResourceDoc = {
    url: string
    created_at: string
    hash: string
    path: string
}

export const resources = VPouchdb<ResourceDoc>('resources', {
    index: { fields: ['url', 'created_at'] },
})

function withRelativeURL(version: ResourceDoc) {
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
    hash: string
    mimetype?: string
}) {
    const outputDir = DateTime.local().toFormat('yyyyMMdd')

    const id = ulid()
    const ext = mimetype && extension(mimetype)
    const filename = ext ? `${id}.${ext}` : id
    const path = `${outputDir}/${filename}`

    await resourcesDirectory.file(path).write(buffer)

    const doc: ResourceDoc = {
        url,
        created_at: now(),
        hash,
        path,
    }
    await (await resources).post(doc)

    return doc
}

async function getVersions(url: string) {
    const result = await (await resources).find({
        selector: {
            url,
            language: { $ne: 'query' },
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
        recentVersion() {
            const last = versions[versions.length - 1] as ResourceDoc | undefined

            if (last && -1 < DateTime.fromISO(last.created_at).diffNow('hours').hours) {
                return last
            }
        },

        findByHash(hash: string) {
            return versions.find(v => v.hash === hash)
        },
    }
}

export type ResourceCreationTasks = { url: string; callback: (url: string) => void }[]

export async function batchCreateResources(tasks: ResourceCreationTasks) {
    const urls = [...new Set(tasks.map(task => task.url))]

    await Promise.all(
        urls.map(async url => {
            const version = await storeResource(url)
            if (!version) {
                return
            }

            tasks.filter(task => task.url === url).forEach(task => task.callback(version.url))
        }),
    ).catch(console.error)
}

export async function storeResource(url: string) {
    const resource = await getVersions(url)
    const recentVersion = resource.recentVersion()

    if (recentVersion) {
        return withRelativeURL(recentVersion)
    }

    const result = await TryAsync(async () => {
        const {
            headers: { 'content-type': mimetype, 'content-length': size },
        } = await got.head(url)

        if (size && parseInt(size) > config.resource.maxSize) {
            return
        }

        const { body } = await got.get(url, { encoding: null })

        if (!body.length || body.length > config.resource.maxSize) {
            return
        }

        const response = { buffer: body, mimetype }

        const hash = getHash(response.buffer)
        const matchedVersion = resource.findByHash(hash)

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
