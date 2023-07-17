export function middleware(
  ctx: IntREST.IntRequest,
  next: IntREST.MiddlewareNext,
) {
  next({
    root: 'middleware',
  })
}
