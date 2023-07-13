import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import { pathToFileURL } from 'url'
import { workerData } from 'worker_threads'
import { escapePath, join } from '../utils/path'
import {
  findMiddlewarePathnames,
  findRoutePathname,
  getRouteReader,
  sendResponseAll,
} from '../utils/router-tools'
import { createReadStream } from 'fs'

const { config, basePath, route, data } = workerData as WorkerProps
const context = {
  ...data,
  query: new URLSearchParams(data.query || ''),
  fileStream: (path: string) => {
    return createReadStream(join(basePath, 'assets', path))
  },
} as Vulppi.RequestContext

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
    module: await import(pathToFileURL(r).toString()),
    path: r,
  })),
)
const routeFiltered = routeModules.filter(
  (r) => !!(r.module[method] || r.module.default?.[method]),
)
const countRouteMethods = routeFiltered.reduce<number>(
  (acc, handler) => (handler ? acc + 1 : acc),
  0,
)

if (countRouteMethods > 1) {
  await sendResponseAll(
    {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      body: {
        message: config.messages?.MULTIPLE_ROUTES || 'Multiple routes found',
        details: routeFiltered.map((r) => escapePath(r.path, basePath)),
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
    context.headers,
  )
}

if (!countRouteMethods) {
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

const { module: routeModule, path: routePathname } = routeFiltered[0]
const requestHandler: Vulppi.RequestHandler | undefined =
  routeModule[method] || routeModule.default?.[method]

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

const middlewarePathnames = await findMiddlewarePathnames(
  basePath,
  routePathname,
)

const middlewareList = (
  await Promise.all(
    middlewarePathnames.map(async (r) => {
      const m = await import(pathToFileURL(r).toString())
      return m.default || m['middleware']
    }),
  )
).filter((m) => !!m) as Vulppi.MiddlewareHandler[]

try {
  const reader = getRouteReader()
  let response: Vulppi.ResponseMessage | null = null

  for (const middleware of middlewareList) {
    response = await new Promise<Vulppi.ResponseMessage | null>(
      async (resolve, reject) => {
        let resolved = false
        try {
          const res =
            (await middleware(context, (c) => {
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
