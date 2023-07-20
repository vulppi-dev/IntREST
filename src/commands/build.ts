import ck from 'chalk'
import { copyFile, existsSync, rmSync } from 'fs'
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
  console.info('\nBuilding application...\n')

  const appFolder = await getAppPath(projectPath)
  console.info(
    '\tApplication path: %s',
    ck.blue.bold(escapePath(appFolder, projectPath)),
  )
  const appFiles = await globFindAll(appFolder, globPatterns.route)
  const compiledFolder = join(projectPath, defaultPaths.compiled)
  if (existsSync(compiledFolder)) rmSync(compiledFolder, { recursive: true })

  await Promise.all(
    appFiles.map(async (filename) => {
      const escapedPath = escapePath(filename, appFolder)
      await callBuild({
        input: appFolder,
        output: join(projectPath, defaultPaths.compiled),
        entry: escapedPath,
        config,
      })
    }),
  )
  copyFile
}

async function getAppPath(basePath: string) {
  return (
    (await globFindAllList(...globPatterns.app.map((p) => [basePath, p])))[0] ||
    'app'
  )
}
