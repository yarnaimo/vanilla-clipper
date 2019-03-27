jest.setTimeout(30000)

const micro = require('micro')
const handler = require('serve-handler')

const server = micro(async (req, res) =>
    handler(req, res, { public: 'server/__tests__/fixture/public' }),
)

beforeAll(() => {
    return new Promise(resolve => server.listen(3000, resolve))
})

afterAll(done => {
    server.close(done)
})
