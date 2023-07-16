import ck from 'chalk'
import { existsSync, rmSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import type { Options } from 'yargs'
import { defaultPaths, globPatterns } from '../utils/constants'
import {
  escapePath,
  getConfigModule,
  globFind,
  globFindAll,
  globFindAllList,
  join,
  normalizePath,
} from '../utils/path'
import { callBuild } from './_builder'

export const command = 'build'

export const describe = 'Build the project'

export const builder: Record<string, Options> = {}

export async function handler(): Promise<void> {
  const projectPath = normalizePath(process.cwd())
  const configPath = await globFind(projectPath, globPatterns.config)
  const config = await getConfigModule(configPath)
  console.log('Building application...')
  await startRouterBuilder(projectPath, config)
}

async function startRouterBuilder(basePath: string, config?: IntREST.Config) {
  const appFolder = await getAppPath(basePath)
  console.log(
    'Application path: %s',
    ck.blue.bold(escapePath(appFolder, basePath)),
  )
  const appFiles = await globFindAll(appFolder, globPatterns.route)
  const compiledFolder = join(basePath, defaultPaths.compiled)
  if (existsSync(compiledFolder)) rmSync(compiledFolder, { recursive: true })

  return Promise.all(
    appFiles.map(async (filename) => {
      const escapedPath = escapePath(filename, appFolder)
      await callBuild({
        input: appFolder,
        output: join(basePath, defaultPaths.compiled),
        entry: escapedPath,
        config,
      })
    }),
  )
}

async function getAppPath(basePath: string) {
  return (
    (await globFindAllList(...globPatterns.app.map((p) => [basePath, p])))[0] ||
    'app'
  )
}
