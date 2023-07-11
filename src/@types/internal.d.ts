declare interface StartApplicationProps {
  config: Vulppi.KitConfig
  basePath: string
}

declare interface CallWorkerProps {
  route: string
  basePath: string
  config: Vulppi.KitConfig
  data: Vulppi.RequestContext
}
