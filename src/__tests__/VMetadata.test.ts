import { IMetadata, VMetadata } from '../core/VMetadata'

let vMetadata: VMetadata
const metadataObject: IMetadata = {
    _version: 1,
    domain: 't.co',
    hostname: 't.co',
    url: 'https://t.co/example',
    title: 'Title',
}

beforeEach(() => {
    vMetadata = new VMetadata()
    vMetadata.set(metadataObject)
})

describe('static', () => {
    test('parse json', async () => {
        const json = JSON.stringify(metadataObject)
        const vMetadata = await VMetadata.parse(json)
        expect(vMetadata).toMatchObject(metadataObject)
    })

    test('parse json (fail)', async () => {
        const json = JSON.stringify({ version: 1 })
        await expect(VMetadata.parse(json)).rejects.toHaveProperty('errors.length', 4)
    })
})

test('#stringify()', () => {
    expect(vMetadata.stringify()).toMatch(`{
    "_createdAt": "${vMetadata._createdAt.dateTime.toISO()}",
    "_version": 1,
    "domain": "t.co",
    "hostname": "t.co",
    "url": "https://t.co/example",
    "title": "Title"
}`)
})
