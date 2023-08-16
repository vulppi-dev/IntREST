import { type IntRequest, type IntResponse } from '@vulppi/intrest'
import { getImage } from './data'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  const stream = await getImage()
  return {
    status: 200,
    body: stream,
    headers: {
      'Content-Type': 'image/jpg',
      'Content-Encoding': 'gzip, deflate',
    },
  }
}
