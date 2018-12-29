import { homedir } from 'os'
import { resolve } from 'path'
import { ISite, Sites } from './site'

export interface IConfigStore {
    sites: ISite[]
}

export class ConfigStore {
    configData: IConfigStore = { sites: [] }

    sites!: Sites

    constructor() {}

    private loadConfigModule(dirname: string) {
        return require(resolve(dirname, '.vanilla-clipper', 'config.js')) as IConfigStore
    }

    load() {
        try {
            this.configData = this.loadConfigModule(process.cwd())
        } catch (error) {
            this.configData = this.loadConfigModule(homedir())
        }

        this.sites = new Sites(this.configData.sites)
    }
}

export const config = new ConfigStore()
config.load()
