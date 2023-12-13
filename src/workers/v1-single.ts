import ck from 'chalk'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { createServer } from 'http'
import { join } from 'path'
import { defaultPaths, globPatterns } from '../controllers/constants'
import { getModule, globFind, normalizePath } from '../controllers/path'
import { buildRequestHandler } from '../controllers/request-handler'
import { tunnel } from '../controllers/tunnel'

const basePath = process.cwd()
const configPath = await globFind(basePath, globPatterns.configFile)
const config = ((await getModule(configPath)).default || {}) as IntREST.Config

const bootstrapPath = await globFind(
  basePath,
  defaultPaths.compiledFolder,
  defaultPaths.compiledRoutes,
  globPatterns.bootstrapCompiled,
)
const bootstrap = await getModule(bootstrapPath)
const bootstrapHandler = bootstrap.bootstrap || bootstrap.default
if (bootstrapHandler && typeof bootstrapHandler === 'function') {
  console.log('\n    Bootstrapping...\n')
  await bootstrapHandler(config)
}

const appPort = config.port || +(process.env.PORT || 4000)
const appTempPath = normalizePath(
  join(basePath, config.paths?.uploadTemp || '.tmp'),
)

if (existsSync(appTempPath)) {
  rmSync(appTempPath, { recursive: true })
}
mkdirSync(appTempPath, { recursive: true })
const server = createServer(
  {
    noDelay: true,
    keepAlive: true,
    keepAliveTimeout: 30000,
    keepAliveInitialDelay: 5000,
    connectionsCheckingInterval: 5000,
  },
  buildRequestHandler(tunnel),
)
server.listen(appPort, () => {
  console.log(`\n    Server running on port %s`, ck.yellow(appPort))
  console.log(
    `    You can access the server at %s or %s\n`,
    ck.yellow(`http://localhost:${appPort}`),
    ck.yellow(`http://127.0.0.1:${appPort}`),
  )
})
