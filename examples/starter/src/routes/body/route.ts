import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function POST({ body }: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    body: body,
  }
}
