export function middleware(
  ctx: IntREST.IntRequest,
  next: IntREST.MiddlewareNext,
) {
  return next({
    root: 'middleware',
  })
}
