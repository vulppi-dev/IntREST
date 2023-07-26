export const isDev = process.env.NODE_ENV === 'development'

export const globPatterns = {
  env: ['.env', '.env.*'],
  app: ['routes', 'src/routes'],
  config: 'intrest.config.{mjs,cjs,js}',
  route: '**/{route,middleware}.ts',
} as const

export const regexpPatterns = {
  env: /^\.env(?:\.[a-z-_]*)?$/,
  config: /^intrest.config.[mc]?js$/,
  route: /(^|\/)(route|middleware).ts$/,
  reservedChars: /([.*+?^=!:${}()|\[\]\/\\])/g,
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
  workerRouter: 'router.mjs',
  workerOpenapi: 'openapi.mjs',
} as const
