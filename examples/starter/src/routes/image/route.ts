import {
  assetsStream,
  type IntRequest,
  type IntResponse,
} from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  const stream = await assetsStream('image.jpg', 'gzip, deflate')

  return {
    status: 200,
    body: stream,
    headers: {
      'Content-Type': 'image/jpg',
      'Content-Encoding': 'gzip, deflate',
    },
  }
}
