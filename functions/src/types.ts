import { tr } from '@yarnaimo/rain'
import { t } from 'bluespark'
import { VDocument } from './core/VDocument'

export type TailArguments<T> = T extends (arg1: any, ...args: infer U) => any ? U : never[]

export type PR<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer R>
    ? R
    : any

export interface DataMap {
    [url: string]: string
}

export type DataListItem = [string, string]

export type StyleSheetData =
    | { type: 'link'; url: string }
    | { type: 'text'; url: string; text: string }
    | { type: 'error'; url: string; error: Error }

export type Sheet = { text: string; url: string }

export type VPlugin = (vDocument: PR<typeof VDocument>) => Promise<void>

export interface VPluginStore {
    beforeLoad: VPlugin[]
    afterLoad: VPlugin[]
}

export interface IFrameData {
    uuid: string
    html: string
}

// export interface IMetadata {
//     _version: number
//     _createdAt: Dayjs
//     domain: string
//     hostname: string
//     url: string
//     title: string
// }

export const Metadata = t.type({
    _version: t.number,
    _createdAt: tr.DayjsFromString,
    domain: t.string,
    hostname: t.string,
    url: t.string,
    title: t.string,
})
