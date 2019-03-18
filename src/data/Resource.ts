import { outputFile } from 'fs-extra'
import { DateTime } from 'luxon'
import 'mime-types'
import { extension } from 'mime-types'
import { ulid } from 'ulid'
import { resolve as resolveURL } from 'url'
import { config } from '../config-store'
import { VDB } from '../core/VDB'
import { got, now, sig } from '../utils'
import { dataPath, dataURLToBuffer, getHash } from '../utils/file'

function resourcePath(...pathSegments: string[]) {
    return dataPath('resources', ...pathSegments)
}

const db = new VDB<IResource>(dataPath('resources.json'), true, false)

interface Version {
    createdAt: string
    hash: string
    path: string
}

export interface IResource {
    url: string
    versions: Version[]
}

export class Resource implements IResource {
    versions: Version[] = []

    recentVersion() {
        const last = this.versions[this.versions.length - 1] as Version | undefined

        if (last && -1 < DateTime.fromISO(last.createdAt).diffNow('hours').hours) {
            return last
        }
    }

    constructor(public url: string) {}

    save() {
        db.put(this.url, { url: this.url, versions: this.versions })
    }

    async createVersion({
        buffer,
        hash,
        mimetype,
    }: {
        buffer: Buffer
        hash?: string
        mimetype?: string
    }) {
        const outputDir = DateTime.local().toFormat('yyyyMMdd')

        const id = ulid()
        const ext = mimetype && extension(mimetype)
        const filename = ext ? `${id}.${ext}` : id
        const path = `${outputDir}/${filename}`

        await outputFile(resourcePath(outputDir, filename), buffer)

        if (hash) {
            const version = {
                createdAt: now(),
                hash,
                path,
            } as Version

            this.versions.push(version)
            this.save()

            return version
        }

        return { path }
    }

    static get(url: string) {
        const resource = new Resource(url)

        try {
            const data = db.get(url)
            Object.assign(resource, data)
        } catch (error) {}

        return resource
    }

    static withRelativeURL(version?: { path: string }) {
        if (!version) {
            return
        }
        return { version, url: `../../resources/${version.path}` }
    }

    static async store(baseURL: string, relativeURL: string, dataURL?: string) {
        const bufferFromDataURL = dataURLToBuffer(relativeURL)

        if (bufferFromDataURL) {
            const resource = new Resource(relativeURL)

            return this.withRelativeURL(await resource.createVersion(bufferFromDataURL))
        }

        const url = resolveURL(baseURL, relativeURL)

        const resource = this.get(url)
        const recentVersion = resource.recentVersion()

        if (recentVersion) {
            return this.withRelativeURL(recentVersion)
        }

        try {
            const response = await (async () => {
                if (dataURL) {
                    return dataURLToBuffer(dataURL)
                }

                const {
                    headers: { 'content-type': mimetype, 'content-length': size },
                } = await got.head(dataURL || url)

                if (size && parseInt(size) > config.resource.maxSize) {
                    return
                }

                const { body } = await got.get(url, { encoding: null })

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
                return this.withRelativeURL(matchedVersion)
            }

            return this.withRelativeURL(
                await resource.createVersion({
                    buffer: response.buffer,
                    hash,
                    mimetype: response.mimetype,
                })
            )
        } catch (error) {
            sig.warn(error)
            return
        }
    }
}
