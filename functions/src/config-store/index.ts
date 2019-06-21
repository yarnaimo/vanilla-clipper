import { getDomain } from 'tldjs'
import configModule from '../.config/default'
import { Site } from './site'

export interface IConfig {
    twitter?: {
        consumerKey: string
        consumerSecret: string
        token: string
        tokenSecret: string
        userId: string
    }
    databaseURL: string
    regions: string[]
    resource: { maxSize: number }
    sites: ISite[]
}

type PageAction = 'goto' | 'focus' | 'input' | 'click' | 'submit' | 'wait'

export interface ISite {
    url: string
    userAgent: string
    accounts: {
        [label: string]:
            | {
                  isLoggedIn?: boolean
                  [key: string]:
                      | boolean
                      | string
                      | (() => string | Promise<string>)
                      | undefined
              }
            | undefined
    }
    login: [PageAction, ...string[]][]
}

const sites = configModule.sites.map(Site)

export const config = {
    ...configModule,
    findSite: (url: string) =>
        sites.find(s => getDomain(s.url) === getDomain(url)),
}
