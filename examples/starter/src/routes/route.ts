import type { IntRequest, IntResponse } from '@vulppi/intrest'

const hello = {
  status: 200,
  body: 'Hello World!',
}

export async function GET({ custom }: IntRequest): Promise<IntResponse> {
  if (!custom.user) {
    return {
      status: 401,
      body: {
        name: 'Unauthorized',
        message: 'You need to be logged in to access this route.',
      },
    }
  }

  return hello
}

export const POST = async () => {
  return {
    status: 200,
    body: 'Hello World!',
  }
}
