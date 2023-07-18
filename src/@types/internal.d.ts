declare interface StartApplicationProps {
  configPath: string
  basePath: string
}

type OmittedRequest =
  | 'query'
  | 'params'
  | 'assetsStream'
  | 'assetsRawContent'
  | 'assetsContent'

declare interface WorkerProps {
  requestId: string
  basePath: string
  config: IntREST.Config
  data: Omit<IntREST.IntRequest, OmittedRequest> & {
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
    options?: IntREST.CookieOptions
  }
  'clear-cookie': {
    name: string
    options?: IntREST.CookieOptions
  }
  set: [string, number | string | readonly string[] | undefined]
  status: number
  write: Uint8Array
  read?: number
  end?: undefined
}

declare type ResponseData = ResponseDataMap[ResponseState]

declare interface TransferResponse {
  requestId: string
  state: ResponseState
  data: ResponseData
}
