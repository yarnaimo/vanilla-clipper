import express from 'express'
import { resolve } from 'path'
import { MockBucket } from './mocks/storage'
const fb = require('../utils/firebase')

export const publicFilePath = (name: string) => resolve(__dirname, 'fixture/public', name)

export const servedFileURL = (path: string) => `http://localhost:3000/${path}`

export const launch = () => {
    const bucket = MockBucket()
    fb.bucket = bucket

    const app = express()

    app.use(express.static(__dirname + '/fixture/public'))

    app.get('/:dir/:name', (req, res) => {
        res.send(bucket.file(`${req.params.dir}/${req.params.name}`).data)
    })

    const server = app.listen(3000)

    afterAll(done => {
        server.close(done)
    })
}
