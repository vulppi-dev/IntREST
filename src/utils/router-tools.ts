import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import { dirname } from 'path'
import rangeParser from 'range-parser'
import { Readable, Writable } from 'stream'
import { parentPort } from 'worker_threads'
import { defaultPaths } from '../utils/constants'
import {
  escapePath,
  globFindAll,
  globFindAllList,
  join,
  normalizePath,
} from '../utils/path'
import { parseStringBytesToNumber } from './app-tools'
import { isBuffer } from './buffer'

const maxChunkSize = parseStringBytesToNumber('1mb')

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
  res: Vulppi.ResponseMessage,
  reqHeaders: Vulppi.RequestContext['headers'],
): Promise<never> {
  for (const entry of Object.entries(res.headers || {})) {
    sendResponse({
      state: 'set',
      data: entry,
    })
  }
  for (const entry of Object.entries(res.cookies || {})) {
    sendResponse({
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
  const length = _.get(
    res.headers || {},
    lengthHeaderKey || 'Content-Length',
    Infinity,
  )
  const range = reqHeaders.range
    ? rangeParser(+length, reqHeaders.range, { combine: true })
    : undefined

  if (res.body) {
    if (typeof res.body === 'string' || isBuffer(res.body)) {
      const data = Buffer.from(res.body)
      if (isRange(range)) {
        sendResponse({
          state: 'write',
          data: data.subarray(range[0].start, range[0].end + 1),
        })
      } else {
        sendResponse({
          state: 'write',
          data,
        })
      }
    } else if (res.body instanceof Readable) {
      sendResponse({
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
    }
  }

  sendResponse({
    state: 'status',
    data:
      isRange(range) && res.status === 200
        ? StatusCodes.PARTIAL_CONTENT
        : res.status,
  })
  return sendResponse({
    state: 'end',
    data: undefined,
  })
}

export function sendResponse<R extends TransferResponse>(
  res: R,
): R['state'] extends 'end' ? never : void {
  parentPort?.postMessage(res)
  if (res.state === 'end') {
    return process.exit(0)
  }
  return undefined as any
}

export async function findMiddlewarePathnames(
  basePath: string,
  routeFilePath: string,
) {
  const dir = dirname(
    escapePath(routeFilePath, join(basePath, defaultPaths.compiledApp)),
  )
  const directories = recursiveDirectoryList(dir)
  const searchList = directories.map((r) =>
    [basePath, defaultPaths.compiledApp, r, 'middleware.mjs'].filter(Boolean),
  )

  return await globFindAllList(...searchList)
}

export async function findRoutePathname(basePath: string, route: string) {
  const routesPathnames = await globFindAll(
    basePath,
    defaultPaths.compiledApp,
    '**/route.mjs',
  )
  const routes = routesPathnames.map((r) => {
    const escapedRoute = escapePath(r, join(basePath, defaultPaths.compiledApp))
    return escapedRoute
      .replace(/[\/\\]?\([a-z0-1]+\)/gi, '')
      .replace(/route\.mjs$/, '')
      .replace(/\/*$/, '')
      .replace(/^\/*/, '/')
  })
  const indexes = routes.map((r, i) => (r === route ? i : -1))
  return routesPathnames
    .map((r, i) => (indexes[i] >= 0 ? r : null))
    .filter(Boolean) as string[]
}

export function recursiveDirectoryList(path: string) {
  const dirs = normalizePath(path)
    .split('/')
    .map((_, i, arr) => arr.slice(0, i + 1).join('/'))
  if (!dirs.includes('')) dirs.unshift('')
  return dirs
}

export function getRouteReader() {
  const reader = new Readable({
    read(size) {
      parentPort?.postMessage({
        state: 'read',
        data: size,
      })
    },
  })
  return reader
}

export function getRouteWriter() {
  const writer = new Writable({
    write(chunk, encoding, callback) {
      parentPort?.postMessage({
        state: 'write',
        data: Buffer.from(chunk),
      })
      callback()
    },
  })
  return writer
}
