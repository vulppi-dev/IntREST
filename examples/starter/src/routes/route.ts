import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET({}: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    body: {
      VALUE: process.env.VALUE,
      ANOTHER_VALUE: process.env.ANOTHER_VALUE,
      MY_VALUE: process.env.MY_VALUE,
    },
  }
}
