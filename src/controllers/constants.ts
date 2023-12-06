export const isDev = () => process.env.NODE_ENV === 'development'

export const globPatterns = {
  env: ['.env', '.env{.local,.development,.production}'],
  entryFolder: ['routes', 'src/routes'],
  assetsFolder: ['assets', 'src/assets'],
  staticFolder: ['static', 'src/static', 'public', 'src/public'],
  configFile: 'intrest.config.{mjs,cjs,js}',
  envFile: '.env{.local,.development,.production}',
  bootstrapEntry: 'bootstrap.ts',
  bootstrapCompiled: 'bootstrap.mjs',
  entryPoints: '**/{route,middleware,validation}.ts',
  identityPoints: '**/__identity.mjs',
  middlewarePoints: '**/middleware.mjs',
  routeFile: 'route.{mjs,cjs,js,ts}',
  middlewareFile: 'middleware.{mjs,cjs,js,ts}',
} as const

export const regexpPatterns = {
  env: /^\.env(?:\.[a-z-_]*)?$/,
  config: /^intrest\.config\.[mc]?js$/,
  bootstrap: /^bootstrap\.ts$/,
  entry: /(?:^|\/)(?:route|middleware|validation)\.ts$/,
  observable: /(?:route)\.ts$/,
  reservedChars: /(?:[.*+?^=!:${}()|\[\]\/\\])/g,
  startSlashesOrNot: /^[\\\/]*/,
  endSlashesOrNot: /[\\\/]*$/,
  multiSlashes: /[\\\/]+/g,
  isBusboyContentType: /^(?:x-www-form-urlencoded|multipart\/form-data.*)$/i,
  isJSONContentType: /^application\/json$/i,
  isXMLContentType: /^application\/xml$/i,
  isAcceptableContentType:
    /^(?:x-www-form-urlencoded|multipart\/form-data.*|application\/(?:json|xml))$/i,
} as const

export const defaultPaths = {
  compiledFolder: '.intrest',
  compiledRoutes: 'routes',
  workerMultiWorker: 'multi.mjs',
  workerSingleWorker: 'single.mjs',
  workerRouter: 'router.mjs',
  routeIdentity: '__identity.mjs',
} as const

export const defaultOutputPaths = {
  vercel: '.vercel/output',
}
