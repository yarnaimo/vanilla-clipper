import { VDocument } from './core/VDocument'

export type TailArguments<T> = T extends (arg1: any, ...args: infer U) => any ? U : never[]

export interface DataMap {
    [url: string]: string
}

export type DataListItem = [string, string]

export type StyleSheetData =
    | { type: 'link'; link: string }
    | { type: 'text'; text: string }
    | { type: 'error'; error: Error }

export type VPlugin = (vDocument: VDocument) => Promise<void>

export interface VPluginStore {
    beforeLoad: VPlugin[]
    afterLoad: VPlugin[]
}

export interface IFrameData {
    uuid: string
    html: string
}
