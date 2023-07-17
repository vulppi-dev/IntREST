export function middleware(
  ctx: IntREST.IntRequest,
  next: IntREST.MiddlewareNext,
): void {
  next({
    slug: 'middleware',
  })
}
