import ck from 'chalk'
import { existsSync, rmSync } from 'fs'
import type { Options } from 'yargs'
import { defaultPaths, globPatterns } from '../utils/constants'
import {
  escapePath,
  getAppPath,
  getConfigModule,
  globFind,
  globFindAll,
  join,
  normalizePath,
} from '../utils/path'
import { callBuild, startAST } from './_builder'

export const command = 'build'

export const describe = 'Build the project'

export const builder: Record<string, Options> = {}

export async function handler(): Promise<void> {
  // Get the project path
  const projectPath = normalizePath(process.cwd())
  // Try to find the config file
  const configPath = await globFind(projectPath, globPatterns.config)
  // Try to get the config module
  const config = await getConfigModule(configPath)

  console.info('\nBuilding application...')
  console.log('Project folder: %s\n', ck.blue(projectPath))

  // Get the application folder
  const appFolder = await getAppPath(projectPath)
  console.info(
    '\tApplication path: %s',
    ck.blue.bold(escapePath(appFolder, projectPath)),
  )
  // Get all the route and middleware files in the application folder
  const appFiles = await globFindAll(appFolder, globPatterns.route)
  // Get the compiled folder
  const compiledFolder = join(projectPath, defaultPaths.compiled)
  // If the compiled folder exists, delete it
  if (existsSync(compiledFolder)) rmSync(compiledFolder, { recursive: true })

  startAST()
  // Build the application files
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
}
