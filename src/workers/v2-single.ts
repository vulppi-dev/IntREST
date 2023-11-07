import ck from 'chalk'
import { certificateFor } from 'devcert'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { createSecureServer, createServer } from 'http2'
import { join } from 'path/posix'
import { defaultPaths, globPatterns, isDev } from '../utils/constants'
import { getModule, globFind } from '../utils/path'
import { buildRequestHandlerV2 } from '../utils/request-handler-v2'
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
const bootstrapHandler = bootstrap.bootstrap || bootstrap.default
if (bootstrapHandler && typeof bootstrapHandler === 'function') {
  console.log('\n    Bootstrapping...\n')
  await bootstrapHandler(config)
}

const appPort = config.port || +(process.env.PORT || 4000)
const appTempPath = join(basePath, config.paths?.uploadTemp || '.tmp')

if (existsSync(appTempPath)) {
  rmSync(appTempPath, { recursive: true })
}
mkdirSync(appTempPath, { recursive: true })

const ssl = await certificateFor(['localhost'])
const server = isDev()
  ? createSecureServer(
      {
        cert: ssl.cert,
        key: ssl.key,
        keepAlive: true,
        keepAliveInitialDelay: 5000,
      },
      buildRequestHandlerV2(tunnel),
    )
  : createServer(buildRequestHandlerV2(tunnel))

server.listen(appPort, () => {
  console.log(`\n    Server running on port %s`, ck.yellow(appPort))
  console.log(
    `    You can access the server at %s or %s\n`,
    ck.yellow(`https://localhost:${appPort}`),
    ck.yellow(`https://127.0.0.1:${appPort}`),
  )
})
