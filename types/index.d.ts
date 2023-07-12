declare global {
  namespace Vulppi {
    interface KitConfig {
      /**
       * The port where the application will be running
       * @default 4000
       */
      port?: number
      /**
       * If you want change the default folder for the application
       */
      folders?: {
        /**
         * The folder where the application will be store temporary files
         * when the request is uploading files
         */
        uploadTemp?: string
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
         * @default '1mb'
         */
        bodyMaxSize?: number | string
        /**
         * Control origin for CORS
         * When `null` | `undefined` | `false` CORS is disabled
         *
         * @default undefined
         */
        cors?: undefined | null | false | string | string[]
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
         * The message for the status code 400
         *
         * @default 'Multiple routes found'
         */
        MULTIPLE_ROUTES?: string
        /**
         * The message for the status code 413
         *
         * @default 'Request entity too large'
         */
        REQUEST_TOO_LONG?: string
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

    interface RequestContext {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
      query: Record<string, any>
      cookies: Record<string, string>
      headers: import('http').IncomingHttpHeaders
      body: Record<string, any> | string | undefined
      reader: import('stream').Readable
      custom?: CustomRequestData
    }

    interface ResponseMessage {
      body?:
        | string
        | Record<string, any>
        | Blob
        | ArrayBuffer
        | Uint8Array
        | import('stream').Writable
      status?: number
      headers?: Record<string, string | string[] | undefined> &
        import('http').IncomingHttpHeaders
      cookies?: Record<string, ValueCookie>
      clearCookies?: Record<string, CookieOptions>
    }

    type CookieOptions = import('express').CookieOptions

    interface SetCookie {
      name: string
      value: string
      options?: CookieOptions
    }

    interface ValueCookie {
      value: string
      options?: CookieOptions
    }

    interface ClearCookie {
      name: string
      options?: CookieOptions
    }

    interface RequestHandler {
      (context: RequestContext):
        | Promise<ResponseMessage | void>
        | ResponseMessage
        | void
    }

    interface MiddlewareHandler {
      (context: RequestContext, next: MiddlewareNext):
        | Promise<ResponseMessage | void>
        | ResponseMessage
        | void
    }

    interface MiddlewareNext {
      (custom?: CustomRequestData): void
    }

    type Primitive = string | number | boolean

    interface QueryData {
      [x: string]: undefined | Primitive | Primitive[] | QueryData | QueryData[]
    }
  }

  interface CustomRequestData {
    [x: string]: any
  }
}

export type KitConfig = Vulppi.KitConfig
export type RequestContext = Vulppi.RequestContext
export type RequestHandler = Vulppi.RequestHandler
export type MiddlewareHandler = Vulppi.MiddlewareHandler
export type MiddlewareNext = Vulppi.MiddlewareNext
export type ResponseMessage = Vulppi.ResponseMessage
export type QueryData = Vulppi.QueryData
