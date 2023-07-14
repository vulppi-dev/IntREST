export function middleware(
  ctx: IntelliREST.RequestContext,
  next: IntelliREST.MiddlewareNext,
): void {
  next({
    root: 'middleware',
  })
}
