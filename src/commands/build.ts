import ck from 'chalk'
import { existsSync, rmSync } from 'fs'
import type { Options } from 'yargs'
import { defaultPaths, globPatterns } from '../utils/constants'
import {
  escapePath,
  getAppPath,
  getModule,
  globFind,
  globFindAll,
  join,
  normalizePath,
} from '../utils/path'
import { callBuild } from './_builder'

export const command = 'build'

export const describe = 'Build the project'

export const builder: Record<string, Options> = {}

export async function handler(): Promise<void> {
  // Get the project path
  const projectPath = normalizePath(process.cwd())
  // Try to find the config file
  const configPath = await globFind(projectPath, globPatterns.config)
  // Try to get the config module
  const config = ((await getModule(configPath)).default || {}) as IntREST.Config

  console.info('\nBuilding application...')
  console.log('Project folder: %s\n', ck.cyan(projectPath))

  // Get the application folder
  const appFolder = await getAppPath(projectPath)
  console.info(
    '    Application path: %s\n',
    ck.cyan.bold(escapePath(appFolder, projectPath)),
  )
  // Get all the route and middleware files in the application folder
  const appFiles = await globFindAll(appFolder, globPatterns.route)
  const bootstrapFile = await globFind(appFolder, globPatterns.bootstrap)
  if (bootstrapFile) {
    appFiles.push(bootstrapFile)
  }
  // Get the compiled folder
  const compiledFolder = join(projectPath, defaultPaths.compiled)
  // If the compiled folder exists, delete it
  if (existsSync(compiledFolder)) rmSync(compiledFolder, { recursive: true })

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
