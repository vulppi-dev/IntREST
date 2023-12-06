import _ from 'lodash'

export async function middlewareChain(
  ...middlewares: IntREST.MiddlewareHandler[]
): Promise<IntREST.MiddlewareHandler> {
  return async function middlewareChainLoop(context, next) {
    let response: IntREST.IntResponse | null = null

    for (const middleware of middlewares) {
      response = await new Promise<IntREST.IntResponse | null>(
        async (resolve, reject) => {
          let resolved = false
          try {
            const res =
              (await middleware(context, (c) => {
                context.custom = _.merge(context.custom, c)
                resolved = true
              })) ?? null

            if (res || resolved) resolve(res)
          } catch (error) {
            reject(error)
          }
        },
      )
      if (response) {
        return response
      }
    }
    next()
  }
}
