declare interface StartApplicationProps {
  config: Vulppi.KitConfig
  basePath: string
}

declare interface WorkerProps {
  route: string
  basePath: string
  config: Vulppi.KitConfig
  data: Omit<Vulppi.RequestContext, 'reader'>
}

declare interface CallWorkerProps extends WorkerProps {
  reader: import('stream').Readable
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
  set: [string, string | string[] | undefined]
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

declare interface TransferResponseCore {
  state: ResponseState | 'read'
  data: ResponseData & ResponseDataMap['read']
}
