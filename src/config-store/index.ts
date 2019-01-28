import { homedir } from 'os'
import { resolve } from 'path'
import { ISite, Sites } from './site'

export interface IConfig {
    twitter?: {
        consumerKey: string
        consumerSecret: string
        token: string
        tokenSecret: string
        userId: string
    }
    sites: ISite[]
}

export class ConfigStore {
    twitter?: IConfig['twitter']

    sites!: Sites

    constructor() {}

    private loadConfigFile(dirname: string) {
        return require(resolve(dirname, '.vanilla-clipper', 'config.js')) as IConfig
    }

    load() {
        let loadedConfig: IConfig
        try {
            loadedConfig = this.loadConfigFile(process.cwd())
        } catch (error) {
            loadedConfig = this.loadConfigFile(homedir())
        }

        this.sites = new Sites(loadedConfig.sites)
        this.twitter = loadedConfig.twitter
    }
}

export const config = new ConfigStore()
config.load()
