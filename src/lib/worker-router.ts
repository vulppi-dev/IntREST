import { StatusCodes } from 'http-status-codes'
import { pathToFileURL } from 'url'
import { workerData } from 'worker_threads'
import { escapePath } from '../utils/path'
import {
  findMiddlewarePathnames,
  findRoutePathname,
  sendResponse,
} from './router-tools'
import _ from 'lodash'

const { config, basePath, route, data } = workerData as CallWorkerProps
const routePathnames = await findRoutePathname(basePath, route)
if (!routePathnames.length) {
  sendResponse({
    status: StatusCodes.NOT_FOUND,
    data: {
      message: config.messages?.NOT_FOUND || 'Not found Route',
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

const method = data.method?.toUpperCase() || 'GET'
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
  sendResponse({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    data: {
      message: config.messages?.MULTIPLE_ROUTES || 'Multiple routes found',
      details: routeFiltered.map((r) => escapePath(r.path, basePath)),
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

if (!countRouteMethods) {
  sendResponse({
    status: StatusCodes.METHOD_NOT_ALLOWED,
    data: {
      message: config.messages?.METHOD_NOT_ALLOWED || 'Method not allowed',
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

const { module: routeModule, path: routePathname } = routeFiltered[0]
const requestHandler: Vulppi.RequestHandler | undefined =
  routeModule[method] || routeModule.default?.[method]

if (typeof requestHandler !== 'function') {
  sendResponse({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    data: {
      message:
        config.messages?.INTERNAL_SERVER_ERROR || 'Internal server error',
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
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
  const middlewareResult = await middlewareList.reduce(
    async (promise, middleware) => {
      const data = await promise
      return new Promise<Vulppi.RequestContext>(async (resolve, reject) => {
        try {
          let resolved = false
          const res = await middleware(data, (c) => {
            if (data.custom) {
              _.merge(data.custom, c)
            } else {
              data.custom = c
            }
            resolved = true
            resolve(data)
          })

          if (!resolved && res) {
            reject(res)
          }
        } catch (error) {
          reject(error)
        }
      })
    },
    Promise.resolve(data),
  )

  const response = await requestHandler(middlewareResult)

  if (response) {
    sendResponse(response)
  }

  sendResponse({
    status: StatusCodes.OK,
  })
} catch (error) {
  if (error instanceof Error) {
    sendResponse({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      data: {
        message: error.message,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } else if (typeof error === 'object' && error != null) {
    sendResponse(error)
  }

  throw error
}
