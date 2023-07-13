export const globPatterns = {
  env: ['*.env', '.env.*', '*.env.*', '.env'],
  app: ['app', 'src/app'],
  config: 'vulppi.config.{mjs,cjs,js}',
  route: '**/{route,middleware}.ts',
} as const

export const regexpPatterns = {
  env: /^([a-z-_]*.env(\.[a-z-_]*)?)$/,
  config: /^vulppi.config.[mc]?js$/,
  route: /(^|\/)(route|middleware).ts$/,
} as const

export const defaultPaths = {
  compiled: '.vulppi',
  compiledApp: '.vulppi/app',
  workerApp: 'workers/app.mjs',
  workerRouter: 'workers/router.mjs',
}
