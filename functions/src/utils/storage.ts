import { dayjs, got } from '@yarnaimo/rain'
import { createHash } from 'crypto'
import { Dayjs } from 'dayjs'
import { extension } from 'mime-types'
import pl from 'p-limit'
import { config } from '../config-store'
import { bucket } from './firebase'

export const uploadFileFromBuffer = async (buffer: Buffer, contentType: string = '') => {
    const hash = createHash('sha512')
        .update(buffer)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    const ext = extension(contentType)

    const name = ext ? `${hash}.${ext}` : hash
    const path = `resources/${name}`

    const run = async () => {
        const file = bucket.file(path)
        const [exists] = await file.exists()

        if (!exists) {
            await file.save(buffer, {
                gzip: true,
                // predefinedAcl: 'publicRead',
                metadata: { contentType },
            })
        }
    }

    return { path, run }
}

export type ResourceCreationTasks = {
    url: string
    callback: (relativePath: RelativePath) => void
}[]

export const batchSaveResources = async (tasks: ResourceCreationTasks) => {
    const limit = pl(16)
    const urls = [...new Set(tasks.map(task => task.url))]

    const uTasks = urls.map(url =>
        limit(async () => {
            try {
                const relativePath = await saveResource(url)
                if (!relativePath) {
                    return
                }

                tasks.filter(task => task.url === url).forEach(task => task.callback(relativePath))
            } catch (err) {
                console.error(err)
            }
        }),
    )

    await Promise.all(uTasks)
}

export type RelativePath = string & { __relativePath: never }

const cache = new Map<string, { createdAt: Dayjs; path: string }>()

export const saveResource = async (url: string): Promise<RelativePath | undefined> => {
    const toRelative = (path: string) => `../${path}` as RelativePath

    const cached = cache.get(url)
    if (cached && cached.createdAt.diff(dayjs(), 'hour') < 1) {
        return toRelative(cached.path)
    }

    const {
        headers: { 'content-type': contentType, 'content-length': size },
    } = await got.head(url)

    if (size && parseInt(size) > config.resource.maxSize) {
        return
    }

    const { body: buffer } = await got.get(url, { encoding: null })

    if (!buffer.length || buffer.length > config.resource.maxSize) {
        return
    }

    const { path, run } = await uploadFileFromBuffer(buffer, contentType)

    cache.set(url, { createdAt: dayjs(), path })

    await run()

    return toRelative(path)
}
