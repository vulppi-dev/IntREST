import type { RequestContext, ResponseMessage } from '@vulppi/intrest'

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
  return {
    status: 200,
    body: { mode: 'catch', slug: ctx.params, custom: ctx.custom },
  }
}
