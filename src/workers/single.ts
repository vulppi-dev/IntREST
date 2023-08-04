import ck from 'chalk'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { createServer } from 'http'
import { defaultPaths, globPatterns } from '../utils/constants'
import { getModule, globFind, join } from '../utils/path'
import { buildRequestHandler } from '../utils/request-handler'
import { tunnel } from '../utils/tunnel'

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
if (bootstrap.bootstrap && typeof bootstrap.bootstrap === 'function') {
  console.log('\n    Bootstrapping...\n')
  await bootstrap.bootstrap(config)
}

const appPort = config.port || +(process.env.PORT || 4000)
const appTempPath = join(basePath, config.paths?.uploadTemp || '.tmp')

if (existsSync(appTempPath)) {
  rmSync(appTempPath, { recursive: true })
}
mkdirSync(appTempPath, { recursive: true })
const server = createServer({ noDelay: true }, buildRequestHandler(tunnel))
server.listen(appPort, () => {
  console.log(`\n    Server running on port %s`, ck.yellow(appPort))
  console.log(
    `    You can access the server at %s or %s\n`,
    ck.yellow(`http://localhost:${appPort}`),
    ck.yellow(`http://127.0.0.1:${appPort}`),
  )
})
