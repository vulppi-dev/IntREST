import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import { sendResponseParser } from './router-tools'
import { defaultPaths, defaultVariables, globPatterns } from './constants'
import { pathToFileURL } from 'url'
import { encapsulateModule, getFolderPath, globFind, join } from './path'
import { unescape } from 'querystring'
import { lookup } from 'mime-types'
import { createReadStream } from 'fs'

export async function tunnel(
  { data, config, basePath }: Omit<WorkerProps, 'requestId'>,
  endCallback: (state: ResponseState, data: ResponseData) => void,
) {
  const context = {
    ...data,
    params: {},
    query: new URLSearchParams(data.query || ''),
  } as IntREST.IntRequest

  // Send response if static file found
  const staticFolder = await getFolderPath(basePath, globPatterns.staticFolder)
  if (staticFolder) {
    const staticFile = await globFind(staticFolder, data.path)
    if (staticFile) {
      const mimeType = lookup(staticFile)
      if (mimeType) {
        return await sendResponse(
          {
            status: StatusCodes.OK,
            body: createReadStream(staticFile),
            headers: {
              'Content-Type': mimeType,
            },
          },
          context.headers,
          endCallback,
        )
      }
    }
  }

  try {
    // Get route-map module and find router chain
    const { getRoutes, getMiddlewares } = await import(
      encapsulateModule(
        pathToFileURL(
          join(basePath, defaultPaths.compiledFolder, defaultPaths.routesMap),
        ).toString(),
      )
    ).then((m) => ({
      getRoutes: m[defaultVariables.getHandlers] as GetRoutesFunction,
      getMiddlewares: m[
        defaultVariables.getMiddlewares
      ] as GetMiddlewaresFunction,
    }))
    const routes = getRoutes(context.path)

    // Send response not found if no route found
    if (!routes.length) {
      return await sendResponse(
        {
          status: StatusCodes.NOT_FOUND,
          body: {
            message: config.messages?.NOT_FOUND || 'Not found',
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
        context.headers,
        endCallback,
      )
    }

    const method = context.method
    const route = routes.find((r) => typeof r[method] === 'function')
    const handler = route?.[method]

    // Send response not allowed if method not found in route
    if (!route || !handler) {
      return await sendResponse(
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
        endCallback,
      )
    } else if (typeof handler !== 'function') {
      return await sendResponse(
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
        endCallback,
      )
    }

    const paramExtract = route[defaultVariables.paramExtract]
    const pathname = route[defaultVariables.pathname]
    const paramKeys = route[defaultVariables.paramKeys]
    const paramValues = Array.from(data.path.match(paramExtract) || []).slice(1)
    context.params = _.zipObject(paramKeys, paramValues.map(unescape))

    let response: IntREST.IntResponse | null = null

    const middlewares = getMiddlewares(pathname)
    for (const middleware of middlewares) {
      response = await new Promise<IntREST.IntResponse | null>(
        async (resolve, reject) => {
          let timeoutId: NodeJS.Timeout | null = null
          let resolved = false
          try {
            const res =
              (await middleware.handler(context, (c) => {
                if (timeoutId) clearTimeout(timeoutId)
                context.custom = _.merge(context.custom, c)
                resolved = true
              })) ?? null

            if (res || resolved) resolve(res)

            timeoutId = setTimeout(() => {
              reject(
                new Error(`Middleware handler timeout: ${middleware.pathname}`),
              )
            }, config.limits?.middleware?.timeout || 5000)
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
      response = (await handler(context)) ?? null
    }

    if (response) {
      return await sendResponse(response, context.headers, endCallback)
    }
    return await sendResponse(
      {
        status: StatusCodes.NO_CONTENT,
      },
      context.headers,
      endCallback,
    )
  } catch (error) {
    console.error(error)
    if (error instanceof Error) {
      return await sendResponse(
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
        endCallback,
      )
    } else if (typeof error === 'object' && error != null) {
      return await sendResponse(error, context.headers, endCallback)
    }

    throw error
  }
}

async function sendResponse(
  resData: IntREST.IntResponse,
  reqHeaders: IntREST.IntRequest['headers'],
  endCallback: (state: ResponseState, data: ResponseData) => void,
) {
  return await sendResponseParser(resData, reqHeaders, 'void', (ev) => {
    const { state, data } = ev
    endCallback(state, data)
  })
}
