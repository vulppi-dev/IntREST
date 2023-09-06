import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET({}: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    body: 'Hello World!',
    cookies: {
      a: {
        value: '',
        options: {},
      },
    },
  }
}
