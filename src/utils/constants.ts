export const globPatterns = {
  env: ['*.env', '.env.*', '*.env.*', '.env'],
  app: ['app', 'src/app'],
  config: 'intelli-rest.config.{mjs,cjs,js}',
  route: '**/{route,middleware}.ts',
} as const

export const regexpPatterns = {
  env: /^([a-z-_]*.env(\.[a-z-_]*)?)$/,
  config: /^intelli-rest.config.[mc]?js$/,
  route: /(^|\/)(route|middleware).ts$/,
} as const

export const defaultPaths = {
  compiled: '.intelli-rest',
  compiledApp: '.intelli-rest/app',
  workerApp: 'workers/app.mjs',
  workerRouter: 'workers/router.mjs',
}
