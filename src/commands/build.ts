import ck from 'chalk'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'
import type { Options } from 'yargs'
import { defaultPaths, globPatterns } from '../controllers/constants'
import {
  escapePath,
  getFolderPath,
  getModule,
  globFind,
  globFindAll,
  normalizePath,
} from '../controllers/path'
import { callBuild } from './_builder'

export const command = 'build'

export const describe = 'Build the project'

export const builder: Record<string, Options> = {}

export async function handler(): Promise<void> {
  // Get the project path
  const projectPath = normalizePath(process.cwd())
  // Try to find the config file
  const configPath = await globFind(projectPath, globPatterns.configFile)
  // Try to get the config module
  const config = ((await getModule(configPath)).default || {}) as IntREST.Config

  console.info('\nBuilding application...')
  console.log('Project folder: %s\n', ck.cyan(projectPath))

  // Get the application entry folder
  const entryFolder = await getFolderPath(projectPath, globPatterns.entryFolder)
  console.info(
    '    Application entry folder: %s\n',
    ck.cyan.bold(escapePath(entryFolder, projectPath)),
  )
  // Get all the entry files in the application folder
  const appFiles = await globFindAll(entryFolder, globPatterns.entryPoints)
  const bootstrapFile = await globFind(entryFolder, globPatterns.bootstrapEntry)
  if (bootstrapFile) {
    appFiles.push(bootstrapFile)
  }
  // Get the compiled folder
  const compiledFolder = join(projectPath, defaultPaths.compiledFolder)
  // If the compiled folder exists, delete it
  if (existsSync(compiledFolder)) rmSync(compiledFolder, { recursive: true })

  // Build the application files
  await Promise.all(
    appFiles.map(async (filename) => {
      const escapedPath = escapePath(filename, entryFolder)
      await callBuild({
        input: entryFolder,
        output: join(projectPath, defaultPaths.compiledFolder),
        entry: escapedPath,
        config,
      })
    }),
  )

  console.log('\n%s Application built successfully!\n', ck.green('✔'))
  console.log('    run %s to start the application\n', ck.cyan('intrest start'))
}
