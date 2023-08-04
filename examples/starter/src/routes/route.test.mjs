import assert from 'assert'
import supertest from 'supertest'
import { globalRequestHandler } from '@vulppi/intrest'

const agent = supertest.agent(globalRequestHandler)

describe('Status 200 in /', async () => {
  it('should return 200', async () => {
    const res = await agent.get('/')
    assert.strictEqual(res.status, 200)
  })
  it('should result is "Hello World!"', async () => {
    const res = await agent.get('/')
    assert.strictEqual(res.text, 'Hello World!')
  })
})
