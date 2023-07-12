import type { RequestContext, ResponseMessage } from '@vulppi/kit'
import { createReadStream } from 'fs'

export async function GET(ctx: RequestContext): Promise<ResponseMessage> {
  const stream = createReadStream('assets/video.mp4')

  return {
    status: 200,
    body: stream,
    headers: {
      'Content-Type': 'video/mp4',
    },
  }
}
