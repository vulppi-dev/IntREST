import {
  assetsStats,
  assetsStream,
  type IntRequest,
  type IntResponse,
} from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  const stream = await assetsStream('video.mp4')
  const stats = await assetsStats('video.mp4')

  return {
    status: 200,
    body: stream,
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  }
}
