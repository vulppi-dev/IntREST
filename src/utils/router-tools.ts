import { existsSync } from 'fs'
import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import { dirname } from 'path'
import rangeParser from 'range-parser'
import { Readable } from 'stream'
import { parentPort } from 'worker_threads'
import { defaultPaths } from '../utils/constants'
import { escapePath, globFindAll, join, normalizePath } from '../utils/path'
import { isBuffer } from './buffer'

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

export async function sendResponseAll(
  res: IntREST.IntResponse,
  reqHeaders: IntREST.IntRequest['headers'],
  requestId: string,
) {
  for (const entry of Object.entries(res.headers || {})) {
    sendResponse({
      requestId,
      state: 'set',
      data: entry,
    })
  }
  for (const entry of Object.entries(res.cookies || {})) {
    sendResponse({
      requestId,
      state: 'cookie',
      data: {
        name: entry[0],
        value: entry[1].value,
        options: entry[1].options,
      },
    })
  }
  for (const entry of Object.entries(res.clearCookies || {})) {
    sendResponse({
      requestId,
      state: 'clear-cookie',
      data: {
        name: entry[0],
        options: entry[1],
      },
    })
  }
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
  const range = reqHeaders.range
    ? rangeParser(+contentLength, reqHeaders.range, { combine: true })
    : undefined

  if (res.body) {
    if (typeof res.body === 'string' || isBuffer(res.body)) {
      if (!contentType) {
        sendResponse({
          requestId,
          state: 'set',
          data: ['Content-Type', 'text/plain'],
        })
      }
      const data = Buffer.from(res.body)
      if (isRange(range)) {
        sendResponse({
          requestId,
          state: 'write',
          data: data.subarray(range[0].start, range[0].end + 1),
        })
      } else {
        sendResponse({
          requestId,
          state: 'write',
          data,
        })
      }
    } else if (res.body instanceof Readable) {
      if (!contentType) {
        sendResponse({
          requestId,
          state: 'set',
          data: ['Content-Type', 'application/octet-stream'],
        })
      }
      sendResponse({
        requestId,
        state: 'set',
        data: ['Accept-Ranges', 'bytes'],
      })
      const reader = res.body
      if (isRange(range)) {
        const start = range[0].start
        const end = range[0].end

        let rangeLength = end - start + 1
        let readed = 0
        await new Promise<void>((resolve, reject) => {
          reader.on('data', (c) => {
            const chunk = Buffer.from(c)
            if (chunk.length + readed < start) {
              readed += chunk.length
              return
            }
            const offset = start - readed
            const length = Math.min(rangeLength, chunk.length - offset)
            if (length <= 0) {
              return
            }
            const data = chunk.subarray(offset, offset + length)
            sendResponse({
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
            sendResponse({
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
      if (!contentType) {
        sendResponse({
          requestId,
          state: 'set',
          data: ['Content-Type', 'application/json'],
        })
      }
      const body = JSON.stringify(res.body)
      const data = Buffer.from(body)
      if (isRange(range)) {
        sendResponse({
          requestId,
          state: 'write',
          data: data.subarray(range[0].start, range[0].end + 1),
        })
      } else {
        sendResponse({
          requestId,
          state: 'write',
          data,
        })
      }
    }
  }

  sendResponse({
    requestId,
    state: 'status',
    data:
      isRange(range) && res.status === 200
        ? StatusCodes.PARTIAL_CONTENT
        : res.status || StatusCodes.OK,
  })
  sendResponse({
    requestId,
    state: 'end',
    data: undefined,
  })
}

export function sendResponse<R extends TransferResponse>(res: R) {
  parentPort?.postMessage(res)
}

export async function findMiddlewarePathnames(
  basePath: string,
  routeFilePath: string,
) {
  const dir = dirname(
    escapePath(
      routeFilePath,
      join(basePath, defaultPaths.compiled, defaultPaths.compiledApp),
    ),
  )
  const directories = recursiveDirectoryList(dir)
  const searchList = directories.map((r) =>
    join(
      ...[
        basePath,
        defaultPaths.compiled,
        defaultPaths.compiledApp,
        r,
        'middleware.mjs',
      ].filter(Boolean),
    ),
  )
  const middlewarePaths = searchList.filter((r) => existsSync(r))
  return middlewarePaths
}

export async function findRoutePathname(basePath: string, route: string) {
  const routesPathnames = await globFindAll(
    basePath,
    defaultPaths.compiled,
    defaultPaths.compiledApp,
    '**/route.mjs',
  )

  const maps = routesPathnames
    .map((r) => {
      const escapedRoute = escapePath(
        r,
        join(basePath, defaultPaths.compiled, defaultPaths.compiledApp),
      )
      const cleanedRoute = escapedRoute
        .replace(/[\/\\]?\([A-zÀ-ú0-9-_\$]+\)/gi, '')
        .replace(/route\.mjs$/, '')
        .replace(/\/*$/, '')
        .replace(/^\/*/, '/')

      if (/\[\.\.\.[A-zÀ-ú0-9-_\$]+\].+$/.test(cleanedRoute)) {
        throw new Error(`Invalid route path: ${escapedRoute}`)
      }
      const singleParam = Array.from(
        cleanedRoute.matchAll(/\[([A-zÀ-ú0-9-_\$]+)\]/g),
      )
        .map((m) => cleanedRoute.length - (m.index || 0))
        .reduce((acc, cur) => acc + cur, 0)
      const catchParam = Array.from(
        cleanedRoute.matchAll(/\[\.{3,3}([A-zÀ-ú0-9-_\$]+)\]/g),
      )
        .map(() => 1)
        .reduce((acc, cur) => acc + cur, 0)

      return {
        pathname: r,
        route: cleanedRoute,
        weight: singleParam + catchParam * 1000,
        vars: Array.from(
          cleanedRoute.matchAll(/\[(?:\.{3,3})?([A-zÀ-ú0-9-_\$]+)\]/g),
        ).map((m) => m[1]),
        paramRegexp: new RegExp(
          cleanedRoute
            .replace(/\[([A-zÀ-ú0-9-_\$]+)\]/g, '([A-zÀ-ú0-9-_:\\$%]+)')
            .replace(
              /\[\.{3,3}([A-zÀ-ú0-9-_\$]+)\]/g,
              '?([A-zÀ-ú0-9-_:\\$%/]*)',
            )
            .replace(/[\/\\]/, '\\/')
            .replace(/^\^*/, '^')
            .replace(/\$*$/, '\\/?$'),
        ),
      }
    })
    .sort((a, b) => {
      if (b.weight === a.weight) {
        if (b.route.toLowerCase() > a.route.toLowerCase()) return -1
        if (b.route.toLowerCase() < a.route.toLowerCase()) return 1
        return b.pathname.length - a.pathname.length
      }
      return a.weight - b.weight
    })
  return maps.filter((m) => m.paramRegexp.test(route))
}

export function recursiveDirectoryList(path: string) {
  const dirs = normalizePath(path)
    .split('/')
    .map((_, i, arr) => arr.slice(0, i + 1).join('/'))
  if (!dirs.includes('')) dirs.unshift('')
  return dirs
}
