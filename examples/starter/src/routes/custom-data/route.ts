import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET({ custom }: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    body: {
      custom,
    },
  }
}
