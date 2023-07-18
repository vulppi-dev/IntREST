import busboy from 'busboy'
import concat from 'concat-stream'
import cookie from 'cookie'
import { randomUUID } from 'crypto'
import { createWriteStream } from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'
import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import { callWorker } from './call-worker'
import { globPatterns } from './constants'
import {
  parseStringBytesToNumber,
  parseStringToAutoDetectValue,
} from './parser'
import { getConfigModule, globFind, join } from './path'

export async function requestHandler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const basePath = process.env.INTREST_BASE_PATH || process.cwd()
  const configPath = await globFind(basePath, globPatterns.config)
  const contentType = req.headers['content-type']
  const method = (req.method?.toUpperCase() || 'GET') as IntREST.RequestMethods
  const config = await getConfigModule(configPath)
  const appTempPath = join(basePath, config.paths?.uploadTemp || '.tmp')

  if (/^options$/i.test(method)) {
    res.setHeader('Server', 'IntREST')
    res.setHeader('Accept', [
      'application/json',
      'x-www-form-urlencoded',
      'multipart/form-data',
    ])
    res.setHeader('Accept-Encoding', [
      'gzip',
      'ascii',
      'utf8',
      'utf-8',
      'utf16le',
      'ucs2',
      'ucs-2',
      'base64',
      'base64url',
      'latin1',
      'binary',
      'hex',
    ])
    // TODO: Add more custom acceptable domains headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ])
    res.setHeader('Access-Control-Allow-Headers', [
      'Content-Type',
      'Authorization',
      'Range',
      'X-*',
    ])
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age', '86400')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Keep-Alive', ['timeout=5', 'max=1000'])
    res.statusCode = StatusCodes.NO_CONTENT
    res.end()
    return
  }

  let body = {} as Record<string, any>
  const bodySize =
    (req.headers['content-length'] &&
      parseInt(req.headers['content-length'])) ||
    0
  const maxBodySize = parseStringBytesToNumber(
    config.limits?.bodyMaxSize || '1mb',
  )

  if (maxBodySize && bodySize > maxBodySize) {
    res.writeHead(StatusCodes.REQUEST_TOO_LONG, {
      'Content-Type': 'application/json',
    })
    return res.end(
      JSON.stringify({
        message:
          config.messages?.REQUEST_TOO_LONG || 'Request entity too large',
      }),
    )
  }

  if (!/^get$/i.test(method)) {
    if (contentType && !/^application\/json$/i.test(contentType)) {
      await new Promise<void>((resolve, reject) => {
        const bb = busboy({ headers: req.headers })
        bb.on('file', (name, file, info) => {
          const { filename, encoding, mimeType: mimetype } = info
          const fileHash = randomUUID()
          const filePath = join(appTempPath, fileHash)
          const fileMetadata = {
            absolutePath: filePath,
            filename,
            encoding,
            mimetype,
          } as IntREST.FileMetadata
          _.set(body, name, fileMetadata)
          const fileWriter = createWriteStream(filePath, {
            flags: 'w',
          })
          file.pipe(fileWriter, {
            end: true,
          })
        })
        bb.on('field', (name, val) => {
          _.set(body, name, parseStringToAutoDetectValue(val))
        })
        bb.on('close', resolve)
        bb.on('error', reject)
        req.pipe(bb, {
          end: true,
        })
      })
    } else {
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const writer = concat(resolve)
        req.pipe(writer)
      })
      const encoding = req.headers['content-encoding'] as string | undefined
      const bodyString = buffer.toString(encoding as any)
      try {
        body = JSON.parse(bodyString)
      } catch (error: any) {
        res.writeHead(StatusCodes.BAD_REQUEST, {
          'Content-Type': 'application/json',
        })
        return res.end(
          JSON.stringify({
            message: 'Invalid JSON body',
            error: error?.message,
          }),
        )
      }
    }
  }

  try {
    const [route, query] = (req.url || '/').split('?')
    await callWorker(
      {
        route,
        basePath,
        config,
        data: {
          method,
          path: route,
          custom: {},
          headers: req.headers,
          cookies: cookie.parse(req.headers.cookie || ''),
          body,
          query: query || '',
        },
      },
      (state, data) => {
        if (state === 'cookie') {
          const { name, value, options } = data as ResponseDataMap['cookie']
          res.appendHeader('Set-Cookie', cookie.serialize(name, value, options))
        } else if (state === 'clear-cookie') {
          const { name, options } = data as ResponseDataMap['clear-cookie']
          res.appendHeader('Set-Cookie', cookie.serialize(name, '', options))
        } else if (state === 'set') {
          const [name, value] = data as ResponseDataMap['set']
          res.setHeader(name, value || '')
        } else if (state === 'write') {
          const buffer = data as ResponseDataMap['write']
          res.write(buffer)
        } else if (state === 'status') {
          res.statusCode = data as ResponseDataMap['status']
        } else if (state === 'end') {
          res.end()
        }
      },
    )
  } catch (err) {
    console.error(err)
    res.writeHead(StatusCodes.INTERNAL_SERVER_ERROR, {
      'Content-Type': 'application/json',
    })
    return res.end(
      JSON.stringify({
        message:
          config.messages?.INTERNAL_SERVER_ERROR || 'Internal server error',
      }),
    )
  }
}
