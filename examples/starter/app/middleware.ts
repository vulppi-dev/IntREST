export function middleware(
  ctx: Vulppi.RequestContext,
  next: Vulppi.MiddlewareNext,
): void {
  next({
    root: 'middleware',
  })
}
