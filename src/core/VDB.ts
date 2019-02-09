import JsonDB from 'node-json-db'

const processURL = (str: string) => '/' + str.replace(/\//g, '!')

export class VDB<T> extends JsonDB {
    put(dataPath: string, data: T) {
        this.push(processURL(dataPath), data, true)
    }

    get(dataPath: string) {
        return this.getData(processURL(dataPath)) as T
    }
}
