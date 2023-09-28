import type { CookieSerializeOptions } from 'cookie'
import type { IncomingHttpHeaders } from 'http'
import type { Readable } from 'stream'

export * from './lib'

export type Config = IntREST.Config
export type FileMetadata = IntREST.FileMetadata
export type CookieOptions = IntREST.CookieOptions
export type SetCookie = IntREST.SetCookie
export type ClearCookie = IntREST.ClearCookie
export type RequestMethods = IntREST.RequestMethods
export type XMLBody = IntREST.XMLBody
export type CookieMeta = IntREST.CookieMeta

export type IntRequest<
  Params extends Record<string, string> = Record<string, string>,
> = IntREST.IntRequest<Params>
export type IntResponse = IntREST.IntResponse

export type MiddlewareNext = IntREST.MiddlewareNext

export type RequestHandler = IntREST.RequestHandler
export type MiddlewareHandler = IntREST.MiddlewareHandler

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV?: 'development' | 'production' | 'test'
      readonly PORT?: string
      readonly [x: string]: string | undefined
    }
  }

  namespace IntREST {
    /**
     * The configuration for the application
     */
    interface Config {
      /**
       * The port where the application will be running
       * @default 4000
       */
      port?: number
      /**
       * When `true` and the request is uploading files,
       * the files will be removed after the response is sent
       *
       * @default false
       */
      removeUploadFilesAfterResponse?: boolean
      /**
       * If you want change the default paths for the application
       */
      paths?: {
        /**
         * The folder where the application will be store temporary files
         * when the request is uploading files
         *
         * @default '.tmp'
         */
        uploadTemp?: string
        /**
         * The custom path for the `tsconfig.json`
         *
         * @default 'tsconfig.json'
         */
        tsConfig?: string
      }
      /**
       * The limits for the application
       */
      limits?: {
        /**
         * Controls the maximum request body size of JSON.
         * If this is a number, then the value specifies the number of bytes.
         * If it is a string, the value is passed to the bytes library for parsing.
         *
         * @default '100kb'
         */
        jsonMaxSize?: number | string
        /**
         * Controls the maximum request body size.
         * If this is a number, then the value specifies the number of bytes.
         * If it is a string, the value is passed to the bytes library for parsing.
         *
         * @default '10mb'
         */
        bodyMaxSize?: number | string
        /**
         * Control origin for CORS
         * When `null` | `undefined` | `false` CORS is disabled
         *
         * @default undefined
         */
        allowOrigin?: undefined | null | false | string | string[]
        /**
         * The allowed headers for CORS
         */
        allowHeaders?: string[]
        /**
         * The minimum number of workers to keep alive
         *
         * @default 5
         */
        minWorkerPoolSize?: number
        /**
         * The maximum number of workers to keep alive
         *
         * @default 20
         */
        maxWorkerPoolSize?: number
        /**
         * Limits for middleware handlers
         */
        middleware?: {
          /**
           * The max time to wait for a middleware handler to finish in milliseconds
           *
           * @default 5000
           */
          timeout?: number
        }
      }
      messages?: {
        /**
         * The message for the status code 500
         *
         * @default 'Internal server error'
         */
        INTERNAL_SERVER_ERROR?: string
        /**
         * The message for the status code 404
         *
         * @default 'Not found'
         */
        NOT_FOUND?: string
        /**
         * The message for the status code 405
         *
         * @default 'Method not allowed'
         */
        METHOD_NOT_ALLOWED?: string
        /**
         * The message for the status code 413
         *
         * @default 'Request entity too large'
         */
        REQUEST_TOO_LONG?: string
        /**
         * The message for the status code 415
         *
         * @default 'Unsupported media type'
         */
        UNSUPPORTED_MEDIA_TYPE?: string
      }
      /**
       * The environment variables for the application
       * @default process.env
       * @example
       * ```ts
       * {
       *  DOMAIN: 'https://example.com',
       * }
       * ```
       */
      env?: Record<string, string>
    }

    /**
     * The upload files metadata
     */
    interface FileMetadata {
      absolutePath: string
      /**
       * The original filename
       */
      filename: string
      /**
       * The MIME type of the file
       */
      mimetype: string
      /**
       * The encoding of the file
       */
      encoding: string
    }

    type RequestMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    type RequestEncoding = 'gzip' | 'x-gzip' | 'deflate' | 'identity'

    type CompressEncoding =
      | 'gzip'
      | 'deflate'
      | 'gzip, deflate'
      | 'deflate, gzip'

    /**
     * The cookie meta data
     */
    interface CookieMeta {
      path?: string
      expires?: Date
      maxAge?: number
      domain?: string
      secure?: boolean
      httpOnly?: boolean
      sameSite?: 'lax' | 'strict' | 'none'
    }

    type IntRequest<
      Params extends Record<string, string> = Record<string, string>,
      Body extends Record<string, any> = Record<string, any>,
    > = {
      /**
       * The path route of the request
       */
      path: string
      /**
       * The query of the request using the `URLSearchParams` api
       */
      query: URLSearchParams
      /**
       * The cookies of the request
       */
      cookies: Record<string, string>
      /**
       * The cookies of the request
       */
      cookiesMeta: Record<string, CookieMeta>
      /**
       * The params of the request, match with the route patterns
       */
      params: Params
      /**
       * The request headers
       */
      headers: IncomingHttpHeaders
      /**
       * Data merged from middleware handlers when call `next()`
       */
      custom: CustomRequestData
      /**
       *
       */
      origin: {
        url?: URL
        ip?: string
      }
    } & (
      | {
          /**
           * The method of the request
           */
          method: Exclude<RequestMethods, 'GET'>
          /**
           * The parsed body of the request
           */
          body: Body
        }
      | {
          /**
           * The method of the request
           */
          method: 'GET'
          /**
           * Request don't have body if the method is `GET`
           */
          body: undefined
        }
    )

    interface IntResponse {
      /**
       * The body of the response
       */
      body?:
        | string
        | Record<string, any>
        | Blob
        | ArrayBuffer
        | Uint8Array
        | Readable
      /**
       * The status code of the response
       */
      status?: number
      /**
       * The headers of the response
       */
      headers?: Record<string, number | string | string[] | undefined>
      /**
       * The cookies to set in the response
       */
      cookies?: Record<string, SetCookie | SetCookie[]>
      /**
       * The cookies to clear in the response
       */
      clearCookies?: Record<string, CookieOptions | CookieOptions[]>
    }

    type CookieOptions = Omit<CookieSerializeOptions, 'maxAge'> & {
      /**
       * Specifies the number (in seconds) to be the value for the `Max-Age`
       * `Set-Cookie` attribute. The given number will be converted to an integer
       * by rounding down. By default, no maximum age is set.
       *
       * *Note* the {@link https://tools.ietf.org/html/rfc6265#section-5.3|cookie storage model specification}
       * states that if both `expires` and `maxAge` are set, then `maxAge` takes precedence, but it is
       * possible not all clients by obey this, so if both are set, they should
       * point to the same date and time.
       *
       * The max age of the cookie using time string format too
       *
       * @example 60 * 60 * 24 * 7 // 7d
       * @example '1d', '1h', '1m', '1s', '1ms'
       * @example '1 day', '2 hrs', '1 hour', '1 minute', '1 second'
       */
      maxAge?: number | string | undefined
    }

    /**
     * The cookie content to set in the response
     */
    interface SetCookie {
      value: string
      options?: CookieOptions
    }

    /**
     * The cookie to clear in the response
     */
    interface ClearCookie {
      name: string
      options?: CookieOptions
    }

    /**
     * The function to handle the request
     */
    interface RequestHandler {
      (context: IntRequest): Promise<IntResponse | void> | IntResponse | void
    }

    /**
     * The function to handle the middleware
     */
    interface MiddlewareHandler {
      (context: IntRequest, next: MiddlewareNext):
        | Promise<IntResponse | void>
        | IntResponse
        | void
    }

    /**
     * The function to call the next middleware
     */
    interface MiddlewareNext {
      (custom?: Partial<CustomRequestData>):
        | Promise<IntResponse | void>
        | IntResponse
        | void
    }

    /**
     * Type if request body content-type is XML
     */
    type XMLBody = {
      $text?: string
      $attributes?: Record<string, string>
    } & {
      [x: string]: XMLBody | XMLBody[] | undefined
    }
  }

  interface CustomRequestData {
    [x: string]: any
  }
}
