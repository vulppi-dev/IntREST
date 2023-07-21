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
} as const

export const defaultPaths = {
  compiled: '.intrest',
  compiledApp: 'routes',
  compiledGenerated: 'generated',
  workerApp: 'app.mjs',
  workerRouter: 'router.mjs',
}
