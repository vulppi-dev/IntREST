import { existsSync } from 'fs'
import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import { dirname } from 'path'
import rangeParser from 'range-parser'
import { Readable } from 'stream'
import { defaultPaths } from './constants'
import { escapePath, globFindAll, join, normalizePath } from './path'
import { isBuffer } from './compare'

function isRange(
  range?: rangeParser.Result | rangeParser.Ranges,
): range is rangeParser.Ranges {
  return !!(
    range &&
    Array.isArray(range) &&
    range.length &&
    range.type === 'bytes'
  )
}

/**
 * Send the response data to the client through the worker port
 * auto detect the type of response and send the data
 */
export async function sendResponseParser(
  res: IntREST.IntResponse,
  reqHeaders: IntREST.IntRequest['headers'],
  requestId: string,
  sendMessage: (msg: TransferResponse) => void,
) {
  // Get content length and type from the response headers
  const lengthHeaderKey = Object.keys(res.headers || {}).find((k) =>
    /^content-length$/i.test(k),
  )
  const typeHeaderKey = Object.keys(res.headers || {}).find((k) =>
    /^content-type$/i.test(k),
  )
  const contentLength = _.get(
    res.headers || {},
    lengthHeaderKey || 'Content-Length',
    Infinity,
  )
  const contentType = _.get(res.headers || {}, typeHeaderKey || 'Content-Type')

  // Get the range from the request headers
  const range = reqHeaders.range
    ? rangeParser(+contentLength, reqHeaders.range, { combine: true })
    : undefined

  // If has range in request header, add content range and status code and remove content-length
  if (isRange(range)) {
    res.status =
      !res.status || res.status === StatusCodes.OK
        ? StatusCodes.PARTIAL_CONTENT
        : res.status
    res.headers = {
      ...res.headers,
      'Content-Range':
        `bytes ${range[0].start}-${range[0].end}` +
        (contentLength && isFinite(+contentLength) ? `/${contentLength}` : ''),
    }
    delete res.headers[lengthHeaderKey || 'Content-Length']
  }

  // Check if the response has headers to send to the client
  for (const entry of Object.entries(res.headers || {})) {
    sendMessage({
      requestId,
      state: 'set',
      data: entry,
    })
  }
  // Check if the response has cookies to send to the client
  for (const entry of Object.entries(res.cookies || {})) {
    sendMessage({
      requestId,
      state: 'cookie',
      data: {
        name: entry[0],
        value: entry[1].value,
        options: entry[1].options,
      },
    })
  }
  // Check if the response has cookies to clear in the client
  for (const entry of Object.entries(res.clearCookies || {})) {
    sendMessage({
      requestId,
      state: 'clear-cookie',
      data: {
        name: entry[0],
        options: entry[1],
      },
    })
  }

  // Check if the response has a body to send to the client
  if (res.body) {
    // If the response body is a buffer or string
    // send the data to the client like a buffer
    if (typeof res.body === 'string' || isBuffer(res.body)) {
      // If the response has no content type
      // set the content type to text/plain
      if (!contentType) {
        sendMessage({
          requestId,
          state: 'set',
          data: ['Content-Type', 'text/plain'],
        })
      }
      const data = Buffer.from(res.body)
      // If the response has a range header
      // send only the range of the buffer
      if (isRange(range)) {
        sendMessage({
          requestId,
          state: 'write',
          data: data.subarray(range[0].start, range[0].end + 1),
        })
      } else {
        sendMessage({
          requestId,
          state: 'write',
          data,
        })
      }
      // If the response body is a readable stream
    } else if (res.body instanceof Readable) {
      // If the response not has a content type
      // set the content type to application/octet-stream
      if (!contentType) {
        sendMessage({
          requestId,
          state: 'set',
          data: ['Content-Type', 'application/octet-stream'],
        })
      }
      const reader = res.body
      if (isRange(range)) {
        const start = range[0].start
        const end = range[0].end
        let readed = 0

        await new Promise<void>((resolve, reject) => {
          reader.on('data', (c) => {
            const chunk = Buffer.from(c)
            if (chunk.length + readed < start) {
              readed += chunk.length
              return
            }
            if (readed > end) {
              reader.destroy()
              return resolve()
            }
            const offset = Math.max(start - readed, 0)
            const length = Math.min(end + 1 - readed, chunk.length)
            readed += length
            const data = chunk.subarray(offset, offset + length)
            sendMessage({
              requestId,
              state: 'write',
              data,
            })
          })
          reader.on('end', () => {
            resolve()
          })
          reader.on('error', (err) => {
            reject(err)
          })
        })
      } else {
        await new Promise<void>((resolve, reject) => {
          reader.on('data', (chunk) => {
            sendMessage({
              requestId,
              state: 'write',
              data: chunk,
            })
          })
          reader.on('end', () => {
            resolve()
          })
          reader.on('error', (err) => {
            reject(err)
          })
        })
      }
    } else {
      // If the response body is a object
      if (!contentType) {
        sendMessage({
          requestId,
          state: 'set',
          data: ['Content-Type', 'application/json'],
        })
      }
      const body = JSON.stringify(res.body)
      const data = Buffer.from(body)
      if (isRange(range)) {
        sendMessage({
          requestId,
          state: 'write',
          data: data.subarray(range[0].start, range[0].end + 1),
        })
      } else {
        sendMessage({
          requestId,
          state: 'write',
          data,
        })
      }
    }
  }

  // Send the status code to the client
  sendMessage({
    requestId,
    state: 'status',
    data: res.status || StatusCodes.OK,
  })

  // Send the end of the response to the client
  sendMessage({
    requestId,
    state: 'end',
    data: undefined,
  })
}

/**
 * Find the middleware pathnames in the compiled directory
 */
export async function findMiddlewarePathnames(
  basePath: string,
  routeFilePath: string,
) {
  // Get the directory of the route file path
  // and escape it from root project path
  const dir = dirname(
    escapePath(
      routeFilePath,
      join(basePath, defaultPaths.compiledFolder, defaultPaths.compiledRoutes),
    ),
  )
  // Get all directories from the route file path recursively
  const directories = recursiveDirectoryList(dir)
  // Create a list of possible middleware paths
  const searchList = directories.map((r) =>
    join(
      ...[
        basePath,
        defaultPaths.compiledFolder,
        defaultPaths.compiledRoutes,
        r,
        'middleware.mjs',
      ].filter(Boolean),
    ),
  )
  // Filter the list to get only the existing paths
  return searchList.filter((r) => existsSync(r))
}

/**
 * Find all route pathnames in the compiled directory
 */
export async function getAllRoutePathnames(basePath: string) {
  return await globFindAll(
    basePath,
    defaultPaths.compiledFolder,
    defaultPaths.compiledRoutes,
    '**',
    'route.mjs',
  )
}

/**
 * Parse route pathname to route path
 */
export function parseRoutePathname(pathname: string) {
  return (
    pathname
      // Remove groups
      .replace(/[\/\\]?\([A-zÀ-ú0-9-_\$]+\)/gi, '')
      // Remove filename and extension
      .replace(/route\.(mj|cj|j|t)s$/, '')
      // Remove the '\' of end of the path
      .replace(/\/*$/, '')
      // Ensure that starts with `/`
      .replace(/^\/*/, '/')
  )
}

export function parseRoutePathnameToRegexp(pathname: string, basePath: string) {
  const escapedRoute = escapePath(pathname, basePath)
  const cleanedRoute = parseRoutePathname(escapedRoute)

  if (/\[\.\.\.[A-zÀ-ú0-9-_\$]+\].+$/.test(cleanedRoute)) {
    throw new Error(`Invalid route path: ${escapedRoute}`)
  }

  // Compile the route path to a regexp
  return {
    pathname,
    route: cleanedRoute,
    vars: Array.from(
      cleanedRoute.matchAll(/\[(?:\.{3,3})?([A-zÀ-ú0-9-_\$]+)\]/g),
    ).map((m) => m[1]),
    paramRegexp: new RegExp(
      cleanedRoute
        .replace(/\[([A-zÀ-ú0-9-_\$]+)\]/g, '([A-zÀ-ú0-9-_:\\$%]+)')
        .replace(/\[\.{3,3}([A-zÀ-ú0-9-_\$]+)\]/g, '?([A-zÀ-ú0-9-_:\\$%/]*)')
        .replace(/[\/\\]/, '\\/')
        .replace(/^\^*/, '^')
        .replace(/\$*$/, '\\/?$'),
    ),
  }
}

/**
 * Find the route pathnames in the compiled directory
 */
export async function findRoutePathnames(basePath: string, route?: string) {
  const routesPathnames = await getAllRoutePathnames(basePath)
  const maps = routesPathnames.map((r) =>
    parseRoutePathnameToRegexp(
      r,
      join(basePath, defaultPaths.compiledFolder, defaultPaths.compiledRoutes),
    ),
  )

  // Filter the list to get only the match routes if route is defined
  if (route) {
    return maps
      .filter((m) => m.paramRegexp.test(route))
      .sort(sortCompiledRoutes)
  }
  return maps.sort(sortCompiledRoutes)
}

interface CompiledRoute {
  pathname: string
  route: string
  vars: string[]
  paramRegexp: RegExp
}

/**
 * Sort the compiled routes by priority
 */
export function sortCompiledRoutes(a: CompiledRoute, b: CompiledRoute) {
  const aSlipt = a.pathname.split('/')
  const bSlipt = b.pathname.split('/')
  for (let i = 0; i < aSlipt.length; i++) {
    if (aSlipt[i][0] === '[' && bSlipt[i][0] === '[') continue
    if (aSlipt[i][0] === '[') return 1
    if (bSlipt[i]?.[0] === '[') return -1
  }
  if (b.route.toLowerCase() > a.route.toLowerCase()) return -1
  if (b.route.toLowerCase() < a.route.toLowerCase()) return 1
  return b.pathname.length - a.pathname.length
}

/**
 * Get all directories from a path recursively
 */
export function recursiveDirectoryList(path: string) {
  const dirs = normalizePath(path)
    .split('/')
    .map((_, i, arr) => arr.slice(0, i + 1).join('/'))
  if (!dirs.includes('')) dirs.unshift('')
  return dirs
}
