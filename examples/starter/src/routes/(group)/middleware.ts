import type { IntRequest, IntResponse, MiddlewareNext } from '@vulppi/intrest'

export async function middleware(
  {}: IntRequest,
  next: MiddlewareNext,
): Promise<IntResponse> {
  return next({
    slug: 'middleware',
  })
}
