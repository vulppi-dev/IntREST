import type { RequestContext, ResponseMessage } from '@vulppi/kit'

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
  return {
    status: 200,
    body: { mode: 'catch', slug: ctx.params, custom: ctx.custom },
  }
}
