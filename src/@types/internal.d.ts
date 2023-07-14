declare interface StartApplicationProps {
  config: IntelliREST.Config
  basePath: string
}

declare interface WorkerProps {
  route: string
  basePath: string
  config: IntelliREST.Config
  data: Omit<IntelliREST.RequestContext, 'query' | 'fileStream' | 'params'> & {
    query: string
  }
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
    options?: IntelliREST.CookieOptions
  }
  'clear-cookie': {
    name: string
    options?: IntelliREST.CookieOptions
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
