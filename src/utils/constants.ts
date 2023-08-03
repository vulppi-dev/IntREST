export const isDev = () => process.env.NODE_ENV === 'development'

export const globPatterns = {
  env: ['.env', '.env.*'],
  app: ['routes', 'src/routes'],
  config: 'intrest.config.{mjs,cjs,js}',
  bootstrap: 'bootstrap.ts',
  bootstrapCompiled: 'bootstrap.mjs',
  points: '**/{route,middleware}.ts',
  route: 'route.{mjs,cjs,js,ts}',
  middleware: 'middleware.{mjs,cjs,js,ts}',
} as const

export const regexpPatterns = {
  env: /^\.env(?:\.[a-z-_]*)?$/,
  config: /^intrest\.config\.[mc]?js$/,
  bootstrap: /^bootstrap\.ts$/,
  route: /(?:^|\/)(?:route|middleware)\.ts$/,
  observable: /(?:route)\.ts$/,
  reservedChars: /(?:[.*+?^=!:${}()|\[\]\/\\])/g,
  startSlashesOrNot: /^[\\\/]*/,
  endSlashesOrNot: /[\\\/]*$/,
  multiSlashes: /[\\\/]+/g,
  isBusboyContentType: /^(?:x-www-form-urlencoded|multipart\/form-data)$/i,
  isJSONContentType: /^application\/json$/i,
  isXMLContentType: /^application\/xml$/i,
  isAcceptableContentType:
    /^(?:x-www-form-urlencoded|multipart\/form-data|application\/(?:json|xml))$/i,
} as const

export const defaultPaths = {
  compiled: '.intrest',
  compiledApp: 'routes',
  compiledGenerated: 'generated',
  workerApp: 'app.mjs',
  workerServerless: 'serverless.mjs',
  workerRouter: 'router.mjs',
  routesMap: 'routes-map.mjs',
} as const

export const defaultVariables = {
  paramExtract: '$$paramExtract',
  paramKeys: '$$paramKeys',
  pathname: '$$pathname',
  route: '$$route',
  getHandlers: 'getHandlers',
  getMiddlewares: 'getMiddlewares',
} as const
