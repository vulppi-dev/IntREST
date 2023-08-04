import assert from 'assert'
import supertest from 'supertest'
import { globalRequestHandler } from '@vulppi/intrest'

const agent = supertest.agent(globalRequestHandler)

describe('Parse custom data from middleware', () => {
  it('should return 200', async () => {
    const res = await agent.get('/custom-data')
    assert.strictEqual(res.status, 200)
  })
  it('check body is json', async () => {
    const res = await agent.get('/custom-data')
    assert.strictEqual(res.type, 'application/json')
    assert.strictEqual(typeof res.body, 'object')
  })
  it('check body is contain custom object', async () => {
    const res = await agent.get('/custom-data')
    assert.strictEqual(typeof res.body.custom, 'object')
  })
  it('check if custom object contain property root', async () => {
    const res = await agent.get('/custom-data')
    assert.strictEqual(Object.keys(res.body.custom).includes('root'), true)
  })
  it('check if custom object contain property root with "middleware" value', async () => {
    const res = await agent.get('/custom-data')
    assert.strictEqual(res.body.custom.root, 'middleware')
  })
})
