import ck from 'chalk'
import { existsSync, rmSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import type { Options } from 'yargs'
import { defaultPaths, globPatterns } from '../utils/constants'
import {
  escapePath,
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
  console.log('Building application...')
  await startRouterBuilder(projectPath)
}

async function startRouterBuilder(basePath: string) {
  const appFolder = await getAppPath(basePath)
  console.log(
    'Application path: %s',
    ck.blue.bold(escapePath(appFolder, basePath)),
  )
  const appFiles = await globFindAll(appFolder, globPatterns.route)
  const compiledAppFolder = join(basePath, defaultPaths.compiledApp)
  if (existsSync(compiledAppFolder))
    rmSync(compiledAppFolder, { recursive: true })

  return Promise.all(
    appFiles.map(async (filename) => {
      const escapedPath = escapePath(filename, appFolder)
      await callBuild({
        input: appFolder,
        output: join(basePath, defaultPaths.compiledApp),
        entry: escapedPath,
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
