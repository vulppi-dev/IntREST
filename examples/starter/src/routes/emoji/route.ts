import { loved } from '@/data/image'
import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    headers: {
      'content-type': 'text/plain',
      'content-length': loved.length.toString(),
    },
    body: loved,
  }
}
