import Pouchdb from 'pouchdb'
import find from 'pouchdb-find'
Pouchdb.plugin(find)

const url = process.env.POUCHDB_URL || 'http://localhost:5984'

export const VPouchdb = <T>(name: string) => new Pouchdb<T>(`${url}/${name}`)
