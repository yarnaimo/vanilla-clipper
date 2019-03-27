import { Try } from 'trysafe'
import { sig } from '../utils'
import { configFilePath } from '../utils/file'
import { ISite, Sites } from './site'

export interface IConfig {
    twitter?: {
        consumerKey: string
        consumerSecret: string
        token: string
        tokenSecret: string
        userId: string
    }
    resource: { maxSize: number }
    sites: ISite[]
}

export function Config(path: string) {
    const configModule = Try(() => require(path) as IConfig).getOrElseL(l => {
        sig.error('Config file not found')
        return { resource: { maxSize: 50 * 1024 * 1024 }, sites: [] }
    })

    return {
        ...configModule,
        sites: new Sites(configModule.sites),
    }
}

export const config = Config(configFilePath)
