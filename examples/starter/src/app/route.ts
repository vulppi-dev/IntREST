import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  console.log(ctx.query.toString())
  return {
    status: 200,
    body: 'Hello World!',
  }
}
