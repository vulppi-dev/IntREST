import {
  assetsRawContent,
  type IntRequest,
  type IntResponse,
} from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  const body = await assetsRawContent('image.jpg')
  return {
    status: 200,
    body,
    headers: {
      'Content-Type': 'image/jpg',
    },
  }
}
