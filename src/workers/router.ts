import { createReadStream, readFileSync } from 'fs'
import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import { pathToFileURL } from 'url'
import { parentPort } from 'worker_threads'
import { join } from '../utils/path'
import {
  findMiddlewarePathnames,
  findRoutePathname,
  sendResponseAll,
} from '../utils/router-tools'

const isDev = process.env.NODE_ENV === 'development'

function encapsulateModule(v: string) {
  if (!isDev) return v
  return `${v}?update=${Date.now()}`
}

parentPort!.on(
  'message',
  async ({ config, basePath, data, requestId }: WorkerProps) => {
    const context = {
      ...data,
      params: {},
      query: new URLSearchParams(data.query || ''),
      assetsStream: (path: string) => {
        return createReadStream(join(basePath, 'assets', path))
      },
      assetsRawContent: (path: string) => {
        return readFileSync(join(basePath, 'assets', path))
      },
      assetsContent: (path: string) => {
        return readFileSync(join(basePath, 'assets', path)).toString()
      },
    } as IntREST.IntRequest

    const routePathnames = await findRoutePathname(basePath, data.path)

    if (!routePathnames.length) {
      return await sendResponseAll(
        {
          status: StatusCodes.NOT_FOUND,
          body: {
            message: config.messages?.NOT_FOUND || 'Not found Route',
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
        context.headers,
        requestId,
      )
    }

    const method = context.method
    const routeModules = await Promise.all(
      routePathnames.map(async (r) => ({
        module: await import(
          pathToFileURL(encapsulateModule(r.pathname)).toString()
        ),
        paramRegexp: r.paramRegexp,
        vars: r.vars,
        pathname: r.pathname,
      })),
    )
    const routeFiltered = routeModules.filter((r) => !!r.module[method])

    if (!routeFiltered.length) {
      return await sendResponseAll(
        {
          status: StatusCodes.METHOD_NOT_ALLOWED,
          body: {
            message:
              config.messages?.METHOD_NOT_ALLOWED || 'Method not allowed',
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
        context.headers,
        requestId,
      )
    }

    const { module, pathname, paramRegexp, vars } = routeFiltered[0]
    const requestHandler: IntREST.RequestHandler | undefined = module[method]

    if (typeof requestHandler !== 'function') {
      return await sendResponseAll(
        {
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          body: {
            message:
              config.messages?.INTERNAL_SERVER_ERROR || 'Internal server error',
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
        context.headers,
        requestId,
      )
    }

    const paramsValues = Array.from(data.path.match(paramRegexp) || []).slice(1)
    context.params = _.zipObject(vars, paramsValues)

    const middlewarePathnames = await findMiddlewarePathnames(
      basePath,
      pathname,
    )

    const middlewareList = (
      await Promise.all(
        middlewarePathnames.map(async (r) => {
          const m = await import(pathToFileURL(encapsulateModule(r)).toString())
          return {
            handler: m['middleware'] as IntREST.MiddlewareHandler,
            pathname: r,
          }
        }),
      )
    ).filter((m) => !!m.handler)

    try {
      let response: IntREST.IntResponse | null = null

      for (const middleware of middlewareList) {
        response = await new Promise<IntREST.IntResponse | null>(
          async (resolve, reject) => {
            let resolved = false
            try {
              const res =
                (await middleware.handler(context, (c) => {
                  _.merge(context.custom, c)
                  resolved = true
                })) ?? null

              if (res || resolved) resolve(res)
            } catch (error) {
              reject(error)
            }
          },
        )
        if (response) {
          break
        }
      }

      if (!response) {
        response = (await requestHandler!(context)) ?? null
      }

      if (response) {
        return await sendResponseAll(response, context.headers, requestId)
      }
      return await sendResponseAll(
        {
          status: StatusCodes.OK,
        },
        context.headers,
        requestId,
      )
    } catch (error) {
      if (error instanceof Error) {
        return await sendResponseAll(
          {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
              message: error.message,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          },
          context.headers,
          requestId,
        )
      } else if (typeof error === 'object' && error != null) {
        return await sendResponseAll(error, context.headers, requestId)
      }

      throw error
    }
  },
)
