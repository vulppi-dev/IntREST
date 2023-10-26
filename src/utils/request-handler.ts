import busboy from 'busboy'
import ck from 'chalk'
import concat from 'concat-stream'
import cookie from 'cookie'
import { randomUUID } from 'crypto'
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { createWriteStream, rmSync } from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'
import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import _ from 'lodash'
import { join } from 'path/posix'
import { performance } from 'perf_hooks'
import { globPatterns, isDev, regexpPatterns } from './constants'
import {
  parseDecompressBuffer,
  parseStringBytesToNumber,
  parseStringToAutoDetectValue,
} from './parser'
import { getModule, globFind } from './path'
import ms from 'ms'

interface TunnelFunction {
  (
    params: Omit<WorkerProps, 'requestId'>,
    endCallback: (state: ResponseState, data: ResponseData) => void,
  ): Promise<void>
}

function debugRequest(
  startRequestTime: number,
  method: string,
  path: string,
  status: number = 200,
) {
  console.debug(
    '%s(%s - %s) - %s %s',
    ck.yellow(method),
    ck.green(status),
    getReasonPhrase(status),
    ck.bold(path),
    ck.cyan(`${(performance.now() - startRequestTime).toPrecision(5)}ms`),
  )
}

export function buildRequestHandler(tunnel: TunnelFunction) {
  return async function requestHandler(
    req: IncomingMessage,
    res: ServerResponse,
  ) {
    // Get the root path of the project
    const basePath = process.cwd()
    // Try find the config module
    const configPath = await globFind(basePath, globPatterns.configFile)
    const config = ((await getModule(configPath)).default ||
      {}) as IntREST.Config
    // Get the temp path for upload files
    const appTempPath = join(basePath, config.paths?.uploadTemp || '.tmp')

    // Get the request method, path, query and content type
    const method = (req.method?.toUpperCase() ||
      'GET') as IntREST.RequestMethods
    const [prePath, preQuery] = (req.url || '/').split('?')
    const path = decodeURIComponent(prePath)
    const query = preQuery || ''
    const contentType = req.headers['content-type'] || 'application/json'

    // Prepare origin for CORS
    const pureOrigin = req.headers.origin || req.headers.host || ''
    const ipOrigin = req.socket.remoteAddress
    const origin = pureOrigin.replace(/^[a-z]+:\/\//, '')
    const originWithProtocol = /^[a-z]+:\/\//.test(pureOrigin)
      ? pureOrigin
      : pureOrigin.includes('localhost') || isDev()
      ? `http://${pureOrigin || 'localhost'}`
      : pureOrigin
      ? `https://${pureOrigin}`
      : '*'

    // Validate allowOrigin
    if (config.limits?.allowOrigin && !isDev()) {
      const allowOrigin = (
        Array.isArray(config.limits.allowOrigin)
          ? config.limits.allowOrigin
          : [config.limits.allowOrigin]
      ).map((d) => d.replace(/^[a-z]+:\/\//, ''))

      const allowOriginItem = allowOrigin.find((o) => origin.endsWith(o))
      if (allowOriginItem) {
        res.setHeader('Access-Control-Allow-Origin', allowOriginItem)
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*')
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', originWithProtocol)
    }

    // Set default headers
    res.setHeader('Server', 'IntREST')

    res.setHeader('Accept', [
      'application/json',
      'application/xml',
      'x-www-form-urlencoded',
      'multipart/form-data',
    ])
    res.setHeader('Accept-Encoding', ['gzip', 'x-gzip', 'deflate', 'identity'])
    res.setHeader('Access-Control-Allow-Methods', [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ])
    res.setHeader('Access-Control-Allow-Headers', [
      'Content-Length',
      'Content-Type',
      'Authorization',
      'Range',
      '*',
      ...(config.limits?.allowHeaders || []),
    ])
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age', '86400')
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Keep-Alive', ['timeout=5', 'max=30'])

    // Start the request time
    const startRequestTime = performance.now()

    if (/^options$/i.test(method)) {
      res.statusCode = StatusCodes.NO_CONTENT
      res.end()
      return
    }

    // Check if the content type is acceptable
    if (!regexpPatterns.isAcceptableContentType.test(contentType)) {
      res.writeHead(StatusCodes.UNSUPPORTED_MEDIA_TYPE, {
        'Content-Type': 'application/json',
      })
      debugRequest(
        startRequestTime,
        method,
        path,
        StatusCodes.UNSUPPORTED_MEDIA_TYPE,
      )
      return res.end(
        JSON.stringify({
          message:
            config.messages?.UNSUPPORTED_MEDIA_TYPE || 'Unsupported media type',
        }),
      )
    }

    let body = {} as Record<string, any>
    // Check if the body size is acceptable
    const bodySize =
      (req.headers['content-length'] &&
        parseInt(req.headers['content-length'])) ||
      0
    const maxBodySize = parseStringBytesToNumber(
      config.limits?.bodyMaxSize || '10mb',
    )

    if (bodySize > maxBodySize) {
      res.writeHead(StatusCodes.REQUEST_TOO_LONG, {
        'Content-Type': 'application/json',
      })
      debugRequest(startRequestTime, method, path, StatusCodes.REQUEST_TOO_LONG)
      return res.end(
        JSON.stringify({
          message:
            config.messages?.REQUEST_TOO_LONG || 'Request entity too large',
        }),
      )
    }
    const filesToBeRemoved: string[] = []
    // Parse the body if the method is not GET
    if (!/^get$/i.test(method)) {
      // x-www-form-urlencoded and multipart/form-data
      try {
        if (regexpPatterns.isBusboyContentType.test(contentType)) {
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
              filesToBeRemoved.push(filePath)
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
          // application/json and application/xml
          const buffer = await new Promise<Buffer>((resolve) => {
            const writer = concat(resolve)
            req.pipe(writer)
          })
          const encoding = req.headers['content-encoding'] || 'identity'

          const bodyString =
            (
              await parseDecompressBuffer(
                buffer,
                encoding.split(/, */) as IntREST.RequestEncoding[],
              )
            ).toString() || '{}' // default to empty object

          if (regexpPatterns.isJSONContentType.test(contentType)) {
            body = JSON.parse(bodyString)
          } else {
            // is XML Content-Type
            const parser = new XMLParser({
              ignoreAttributes: false,
              allowBooleanAttributes: true,
              attributeNamePrefix: '',
              attributesGroupName: '$attributes',
              commentPropName: '$comment',
              cdataPropName: '$cdata',
              textNodeName: '$text',
              alwaysCreateTextNode: true,
              parseTagValue: true,
              unpairedTags: ['meta', 'link', 'img', 'br', 'hr', 'input'],
            })
            if (!XMLValidator.validate(bodyString)) {
              throw new Error('Invalid XML')
            }

            body = parser.parse(bodyString)
          }
        }
      } catch (err: any) {
        res.writeHead(StatusCodes.BAD_REQUEST, {
          'Content-Type': 'application/json',
        })
        debugRequest(startRequestTime, method, path, StatusCodes.BAD_REQUEST)
        return res.end(
          JSON.stringify({
            message: 'Invalid body',
            error: err.message || err.toString(),
          }),
        )
      }
    }

    const cookies = cookie.parse(req.headers.cookie || '')

    try {
      await tunnel(
        {
          basePath,
          config,
          data: {
            method,
            path,
            custom: {},
            headers: req.headers,
            cookies,
            // TODO: cookiesMeta
            cookiesMeta: {},
            body,
            query,
            origin: {
              url:
                originWithProtocol === '*'
                  ? undefined
                  : new URL(originWithProtocol),
              ip: ipOrigin,
            },
          },
        },
        (state, data) => {
          if (state === 'cookie') {
            const { name, value, options } = data as ResponseDataMap['cookie']
            if (options?.maxAge && typeof options?.maxAge === 'string') {
              options.maxAge = ms(options.maxAge)
            }

            res.appendHeader(
              'Set-Cookie',
              cookie.serialize(name, value, options as any),
            )
          } else if (state === 'clear-cookie') {
            const { name, options } = data as ResponseDataMap['clear-cookie']
            if (options?.maxAge && typeof options?.maxAge === 'string') {
              options.maxAge = ms(options.maxAge)
            }

            res.appendHeader(
              'Set-Cookie',
              cookie.serialize(name, '', options as any),
            )
          } else if (state === 'set') {
            const [name, value] = data as ResponseDataMap['set']
            res.setHeader(name, value || '')
          } else if (state === 'write') {
            const buffer = data as ResponseDataMap['write']
            res.write(buffer)
          } else if (state === 'status') {
            res.statusCode = data as ResponseDataMap['status']
          } else if (state === 'end') {
            if (
              filesToBeRemoved.length &&
              config.removeUploadFilesAfterResponse
            ) {
              for (const file of filesToBeRemoved) {
                try {
                  rmSync(file)
                } catch (err: any) {
                  console.error(`Error removing file ${file}`, err.message)
                }
              }
            }
            debugRequest(startRequestTime, method, path, res.statusCode)
            res.end()
          }
        },
      )
    } catch (err) {
      console.error(err)
      res.writeHead(StatusCodes.INTERNAL_SERVER_ERROR, {
        'Content-Type': 'application/json',
      })
      debugRequest(
        startRequestTime,
        method,
        path,
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
      return res.end(
        JSON.stringify({
          message:
            config.messages?.INTERNAL_SERVER_ERROR || 'Internal server error',
        }),
      )
    }
  }
}
