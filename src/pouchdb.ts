import { got } from '@yarnaimo/rain'
import Pouchdb from 'pouchdb'
import find from 'pouchdb-find'
import { isNode, sig } from '../server/utils'
Pouchdb.plugin(find)

const url = (isNode && process.env.POUCHDB_URL) || 'http://localhost:5984'

got(url).catch(error => {
    sig.fatal('Failed to connect to pouchdb-server')
    if (isNode) {
        process.exit(1)
    }
})

export const VPouchdb = async <T>(name: string, index?: PouchDB.Find.CreateIndexOptions) => {
    const collection = new Pouchdb<T>(`${url}/${name}`)
    if (index) {
        try {
            await collection.createIndex(index)
        } catch (error) {
            throw error
        }
    }
    return collection
}
