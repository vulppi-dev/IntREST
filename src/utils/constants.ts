export const globPatterns = {
  env: ['.env', '.env.*'],
  app: ['app', 'src/app'],
  config: 'intrest.config.{mjs,cjs,js}',
  route: '**/{route,middleware}.ts',
} as const

export const regexpPatterns = {
  env: /^\.env(\.[a-z-_]*)?)$/,
  config: /^intrest.config.[mc]?js$/,
  route: /(^|\/)(route|middleware).ts$/,
} as const

export const defaultPaths = {
  compiled: '.intrest',
  compiledApp: 'app',
  compiledGenerated: 'generated',
  workerApp: 'workers/app.mjs',
  workerRouter: 'workers/router.mjs',
}
