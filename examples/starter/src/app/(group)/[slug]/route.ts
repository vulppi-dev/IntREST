import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    body: { mode: 'slug', slug: ctx.params },
  }
}
