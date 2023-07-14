import type { RequestContext, ResponseMessage } from '@vulppi/intelli-rest'

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
  const stream = ctx.assetsStream('video.mp4')

  return {
    status: 200,
    body: stream,
    headers: {
      'Content-Type': 'video/mp4',
    },
  }
}
