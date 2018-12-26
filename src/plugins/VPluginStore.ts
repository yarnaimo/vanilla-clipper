import { createElementFinder } from '../utils/element'

export type VPlugin = (
    getElements: ReturnType<typeof createElementFinder>,
    document: Document
) => void

export interface VPluginStore {
    beforeLoad: VPlugin[]
    afterLoad: VPlugin[]
}

export class VPluginStore {
    plugins: VPlugin[] = []

    add(vPlugin: VPlugin) {
        this.plugins.push(vPlugin)
    }

    exec(document: Document) {
        const finder = createElementFinder(document)
        this.plugins.forEach(plugin => plugin(finder, document))
    }
}
