import { VJsdom } from '../core/VJsdom'

export type VPlugin = (dom: VJsdom) => void

export interface VPluginStore {
    beforeLoad: VPlugin[]
    afterLoad: VPlugin[]
}

export class VPluginStore {
    plugins: VPlugin[] = []

    add(vPlugin: VPlugin) {
        this.plugins.push(vPlugin)
    }

    exec(dom: VJsdom) {
        this.plugins.forEach(plugin => plugin(dom))
    }
}
