import { createReadStream } from 'fs'
import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import { pathToFileURL } from 'url'
import { workerData } from 'worker_threads'
import { escapePath, join } from '../utils/path'
import {
  findMiddlewarePathnames,
  findRoutePathname,
  sendResponseAll,
} from '../utils/router-tools'

const { config, basePath, route, data } = workerData as WorkerProps
const context = {
  ...data,
  params: {},
  query: new URLSearchParams(data.query || ''),
  fileStream: (path: string) => {
    return createReadStream(join(basePath, 'assets', path))
  },
} as IntelliREST.RequestContext

const routePathnames = await findRoutePathname(basePath, route)

if (!routePathnames.length) {
  await sendResponseAll(
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
  )
}

const method = context.method
const routeModules = await Promise.all(
  routePathnames.map(async (r) => ({
    module: await import(pathToFileURL(r.pathname).toString()),
    paramRegexp: r.paramRegexp,
    vars: r.vars,
    pathname: r.pathname,
  })),
)
const routeFiltered = routeModules.filter((r) => !!r.module[method])

if (routeFiltered.length > 1) {
  await sendResponseAll(
    {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      body: {
        message: config.messages?.MULTIPLE_ROUTES || 'Multiple routes found',
        details: routeFiltered.map((r) => escapePath(r.pathname, basePath)),
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
    context.headers,
  )
}

if (!routeFiltered.length) {
  await sendResponseAll(
    {
      status: StatusCodes.METHOD_NOT_ALLOWED,
      body: {
        message: config.messages?.METHOD_NOT_ALLOWED || 'Method not allowed',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
    context.headers,
  )
}

const { module, pathname, paramRegexp, vars } = routeFiltered[0]
const requestHandler: IntelliREST.RequestHandler | undefined = module[method]

if (typeof requestHandler !== 'function') {
  await sendResponseAll(
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
  )
}

const paramsValues = Array.from(route.match(paramRegexp) || []).slice(1)
context.params = _.zipObject(vars, paramsValues)

const middlewarePathnames = await findMiddlewarePathnames(basePath, pathname)

const middlewareList = (
  await Promise.all(
    middlewarePathnames.map(async (r) => {
      const m = await import(pathToFileURL(r).toString())
      return {
        handler: m['middleware'] as IntelliREST.MiddlewareHandler,
        pathname: r,
      }
    }),
  )
).filter((m) => !!m.handler)

try {
  let response: IntelliREST.ResponseMessage | null = null

  for (const middleware of middlewareList) {
    response = await new Promise<IntelliREST.ResponseMessage | null>(
      async (resolve, reject) => {
        let resolved = false
        try {
          const res =
            (await middleware.handler(context, (c) => {
              if (context.custom) {
                _.merge(context.custom, c)
              } else {
                context.custom = c
              }
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
    await sendResponseAll(response, context.headers)
  }
  await sendResponseAll(
    {
      status: StatusCodes.OK,
    },
    context.headers,
  )
} catch (error) {
  if (error instanceof Error) {
    await sendResponseAll(
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
    )
  } else if (typeof error === 'object' && error != null) {
    await sendResponseAll(error, context.headers)
  }

  throw error
}
