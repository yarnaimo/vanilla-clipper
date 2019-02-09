import { outputFile, readdir } from 'fs-extra'
import { DateTime } from 'luxon'
import 'mime-types'
import { extension } from 'mime-types'
import { join } from 'path'
import { ulid } from 'ulid'
import { resolve as resolveURL } from 'url'
import { config } from '../config-store'
import { VDB } from '../core/VDB'
import { got, now, sig } from '../utils'
import { dataPath, getHash } from '../utils/file'

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
const isError = (value: any): value is Error => value instanceof Error

const hoge = async () =>
    fetch('https://google.com')
        .then(r => r.text())
        .catch(e => e as Error)

async function main() {
    const html = await hoge()
    // html: string | Error

    if (isError(html)) {
        // html: Error
        console.error(html)
        return
    }

    // html: string
    return html
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

    async createVersion(buffer: Buffer, hash: string, mimetype?: string) {
        const outputDir = await (async () => {
            const newestDir = (await readdir(resourcePath()).catch(() => [])).sort().reverse()[0]
            if (!newestDir) {
                return ulid()
            }

            const filesInNewestDir = await readdir(resourcePath(newestDir)).catch(() => [])
            return filesInNewestDir.length < 1000 ? newestDir : ulid()
        })()

        const id = ulid()
        const ext = mimetype && extension(mimetype)
        const filename = ext ? `${id}.${ext}` : id
        const path = join(outputDir, filename)
        const version: Version = {
            createdAt: now(),
            hash,
            path,
        }

        await outputFile(resourcePath(outputDir, filename), buffer)
        this.versions.push(version)
        this.save()

        return version
    }

    static get(url: string) {
        const resource = new Resource(url)

        try {
            const data = db.get(url)
            Object.assign(resource, data)
        } catch (error) {}

        return resource
    }

    static withRelativeURL(version?: Version) {
        if (!version) {
            return
        }
        return { version, url: `../../resources/${version.path}` }
    }

    static async store(baseURL: string, relativeURL: string) {
        const url = resolveURL(baseURL, relativeURL)

        const resource = this.get(url)
        const recentVersion = resource.recentVersion()

        if (recentVersion) {
            return this.withRelativeURL(recentVersion)
        }

        try {
            const {
                headers: { 'content-type': mimetype, 'content-length': size },
            } = await got.head(url)

            if (size && parseInt(size) > config.resource.maxSize) {
                return
            }

            const { body } = await got.get(url, { encoding: null })

            if (body.length > config.resource.maxSize) {
                return
            }

            const hash = getHash(body)
            const matchedVersion = resource.versions.find(v => v.hash === hash)

            if (matchedVersion) {
                return this.withRelativeURL(matchedVersion)
            }

            return this.withRelativeURL(await resource.createVersion(body, hash, mimetype))
        } catch (error) {
            sig.error(error)
            return
        }
    }
}
