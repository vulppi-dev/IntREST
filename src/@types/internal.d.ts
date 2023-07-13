declare interface StartApplicationProps {
  config: Vulppi.KitConfig
  basePath: string
}

declare interface WorkerProps {
  route: string
  basePath: string
  config: Vulppi.KitConfig
  data: Omit<Vulppi.RequestContext, 'query' | 'fileStream'> & { query: string }
}

declare type ResponseState =
  | 'cookie'
  | 'clear-cookie'
  | 'set'
  | 'write'
  | 'status'
  | 'end'

declare type ResponseDataMap = {
  cookie: {
    name: string
    value: string
    options?: Vulppi.CookieOptions
  }
  'clear-cookie': {
    name: string
    options?: Vulppi.CookieOptions
  }
  set: [string, number | string | readonly string[] | undefined]
  status: number
  write: Uint8Array
  read?: number
  end?: undefined
}

declare type ResponseData = ResponseDataMap[ResponseState]

declare interface TransferResponse {
  state: ResponseState
  data: ResponseData
}
