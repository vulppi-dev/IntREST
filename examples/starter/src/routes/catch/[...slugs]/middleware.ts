export function middleware(
  ctx: IntREST.IntRequest,
  next: IntREST.MiddlewareNext,
): void {
  next({
    catch: 'middleware',
  })
}
