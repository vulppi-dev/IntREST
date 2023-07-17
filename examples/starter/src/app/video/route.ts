import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  const stream = ctx.assetsStream('video.mp4')

  return {
    status: 200,
    body: stream,
    headers: {
      'Content-Type': 'video/mp4',
    },
  }
}
