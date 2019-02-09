import { DateTime } from 'luxon'

export interface IMetadata {
    _version: number
    _createdAt: DateTime
    domain: string
    hostname: string
    url: string
    title: string
}
