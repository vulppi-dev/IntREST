import assert from 'assert'
import supertest from 'supertest'
import { globalRequestHandler } from '@vulppi/intrest'

const agent = supertest.agent(globalRequestHandler)

describe('Get video', () => {
  it('should return 200', async () => {
    const res = await agent.get('/video')
    assert.strictEqual(res.status, 200)
  })
  it('check body is video', async () => {
    const res = await agent.get('/video')
    assert.strictEqual(res.type, 'video/mp4')
  })
  it('check content-length exists and is > 0', async () => {
    const res = await agent.get('/video')
    assert.ok(res.header['content-length'])
    assert.strictEqual(+res.header['content-length'] > 0, true)
  })
})
