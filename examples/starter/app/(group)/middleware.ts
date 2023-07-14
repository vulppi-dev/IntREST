export function middleware(
  ctx: IntREST.RequestContext,
  next: IntREST.MiddlewareNext,
): void {
  next({
    slug: 'middleware',
  })
}
