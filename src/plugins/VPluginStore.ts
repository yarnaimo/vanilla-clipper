import { VDocument } from '../core/VDocument'
import { VPlugin } from '../types'

export class VPluginStore {
    plugins: VPlugin[] = []

    add(vPlugin: VPlugin) {
        this.plugins.push(vPlugin)
    }

    async exec(vDocument: VDocument) {
        await this.plugins.reduce(async (prevPromise, plugin) => {
            await prevPromise
            await plugin(vDocument)
        }, Promise.resolve())
    }
}
