import busboy from 'busboy'
import ck from 'chalk'
import concat from 'concat-stream'
import cookie from 'cookie'
import { randomUUID } from 'crypto'
import { createWriteStream, existsSync, mkdirSync, rmSync } from 'fs'
import { IncomingMessage, ServerResponse, createServer } from 'http'
import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import { workerData } from 'worker_threads'
import {
  parseStringBytesToNumber,
  parseStringToAutoDetectValue,
} from '../utils/parser'
import { callWorker } from '../utils/call-worker'
import { join } from '../utils/path'

const { basePath, config } = workerData as StartApplicationProps
const env = process.env as Record<string, string>

const appPort = config.port || +env.PORT || 4000
const appTempPath = join(basePath, config.folders?.uploadTemp || '.tmp')

if (existsSync(appTempPath)) {
  rmSync(appTempPath, { recursive: true })
}
mkdirSync(appTempPath, { recursive: true })

const server = createServer(requestHandler)

async function requestHandler(req: IncomingMessage, res: ServerResponse) {
  const contentType = req.headers['content-type']
  const method = (req.method?.toUpperCase() || 'GET') as Vulppi.RequestMethods

  if (/^options$/i.test(method)) {
    res.setHeader('Server', 'VulppiKit')
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
          } as Vulppi.FileMetadata
          _.set(body, name, fileMetadata)
          const fileWriter = createWriteStream(filePath, {
            flags: 'w',
          })
          file.pipe(fileWriter, {
            end: true,
          })
        })
        bb.on('field', (name, val) => {
          console.log(name, val)
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
    await callWorker(
      {
        route: req.url || '/',
        basePath,
        config,
        data: {
          method,
          headers: req.headers,
          cookies: cookie.parse(req.headers.cookie || ''),
          body,
          query: req.url?.split('?')[1] || '',
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

server.listen(appPort, () => {
  console.log(`Server running on port %s`, ck.yellow(appPort))
})
