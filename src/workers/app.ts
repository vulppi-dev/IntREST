import ck from 'chalk'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { createServer } from 'http'
import { globPatterns } from '../utils/constants'
import { getConfigModule, globFind, join } from '../utils/path'
import { requestHandler } from '../utils/request-handler'

const basePath = process.env.INTREST_BASE_PATH || process.cwd()
const configPath = await globFind(basePath, globPatterns.config)
const config = await getConfigModule(configPath)
const appPort = config.port || +(process.env.PORT || 4000)
const appTempPath = join(basePath, config.paths?.uploadTemp || '.tmp')

if (existsSync(appTempPath)) {
  rmSync(appTempPath, { recursive: true })
}
mkdirSync(appTempPath, { recursive: true })

const server = createServer(requestHandler)
server.listen(appPort, () => {
  console.log(`Server running on port %s`, ck.yellow(appPort))
})
