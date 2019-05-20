// class MockStorage {
//     buckets: { [name: string]: MockBucket }

//     constructor() {
//         this.buckets = {}
//     }

//     bucket(name: string) {
//         return this.buckets[name] || (this.buckets[name] = new MockBucket(name))
//     }
// }
import { SaveOptions } from '@google-cloud/storage'

export const storage = () => ({ bucket: MockBucket })

export const MockBucket = () => {
    const files: { [path: string]: ReturnType<typeof MockFile> } = {}

    return {
        file(path: string) {
            return files[path] || (files[path] = MockFile())
        },
    }
}

const MockFile = () => ({
    data: undefined as any,
    options: undefined as SaveOptions | undefined,

    async exists() {
        return [!!this.data] as const
    },
    async save(data: any, options?: SaveOptions) {
        this.data = data
        this.options = options
    },
})

// class MockFile {
//     path: string
//     contents: Buffer
//     metadata: any

//     constructor(path: string) {
//         this.path = path
//         this.contents = new Buffer(0)
//         this.metadata = {}
//     }

//     get() {
//         return [this, this.metadata]
//     }

//     setMetadata(metadata: any) {
//         const customMetadata = { ...this.metadata.metadata, ...metadata.metadata }
//         this.metadata = { ...this.metadata, ...metadata, metadata: customMetadata }
//     }

//     createReadStream() {
//         const readable = new streamBuffers.ReadableStreamBuffer()
//         readable.put(this.contents)
//         readable.stop()
//         return readable
//     }

//     createWriteStream({ metadata }: any) {
//         this.setMetadata(metadata)

//         const writable = new streamBuffers.WritableStreamBuffer()
//         writable.on('finish', () => {
//             this.contents = writable.getContents() as any
//         })
//         return writable
//     }
// }
