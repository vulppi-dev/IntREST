import ck from 'chalk'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { workerData } from 'worker_threads'
import { parseStringBytesToNumber, recursiveParse } from '../utils/app-tools'
import { callWorker } from '../utils/call-worker'

const { basePath, config } = workerData as StartApplicationProps
const env = process.env as Record<string, string>

const appPort = config.port || +env.PORT || 4000

const app = express()

// Define middleware parsers
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ strict: true, limit: config.limits?.jsonMaxSize }))
app.use(cookieParser())

config.limits?.cors &&
  app.use(
    cors({
      credentials: true,
      origin: (origin, cb) => {
        if (!origin) return cb(new Error('Not allowed by CORS'), false)
        const c = config.limits!.cors as string | string[]

        if (typeof c === 'string') {
          if (c === '*') return cb(null, true)
          if (origin.endsWith(c)) return cb(null, true)
        } else {
          for (const o of c) {
            if (o === '*') return cb(null, true)
            if (origin.endsWith(o)) return cb(null, true)
          }
        }
        if (/(localhost|127\.0\.0\.1):\d{1,8}$/.test(origin))
          return cb(null, true)
        return cb(new Error('Not allowed by CORS'))
      },
    }),
  )

app.all('*', async (req, res) => {
  try {
    const bodySize =
      (req.headers['content-length'] &&
        parseInt(req.headers['content-length'])) ||
      0
    const maxBodySize = parseStringBytesToNumber(
      config.limits?.bodyMaxSize || '1mb',
    )
    if (maxBodySize && bodySize > maxBodySize) {
      return res.status(StatusCodes.REQUEST_TOO_LONG).json({
        message:
          config.messages?.REQUEST_TOO_LONG || 'Request entity too large',
      })
    }
    await callWorker(
      {
        reader: req,
        route: req.path,
        basePath,
        config,
        data: {
          method: req.method as any,
          query: recursiveParse(req.query),
          cookies: req.cookies,
          headers: req.headers,
          body: req.body,
        },
      },
      (state, data) => {
        if (state === 'cookie') {
          const { name, value, options } = data as ResponseDataMap['cookie']
          res.cookie(name, value, options || {})
        } else if (state === 'clear-cookie') {
          const { name, options } = data as ResponseDataMap['clear-cookie']
          res.clearCookie(name, options || {})
        } else if (state === 'set') {
          const [name, value] = data as ResponseDataMap['set']
          res.set(name, value)
        } else if (state === 'write') {
          const buffer = data as ResponseDataMap['write']
          res.write(buffer)
        } else if (state === 'status') {
          res.status(data as ResponseDataMap['status'])
        } else if (state === 'end') {
          res.end()
        }
      },
    )
  } catch (err) {
    console.error(err)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message:
        config.messages?.INTERNAL_SERVER_ERROR || 'Internal server error',
    })
  }
})

// Unhandled errors
app.use(
  (
    err: any,
    _: express.Request,
    res: express.Response,
    __: express.NextFunction,
  ) => {
    console.error(err)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message:
        config.messages?.INTERNAL_SERVER_ERROR || 'Internal server error',
    })
  },
)

app.listen(appPort, () => {
  console.log(`Server running on port %s`, ck.yellow(appPort))
})
