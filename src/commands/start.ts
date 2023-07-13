import ck from 'chalk'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { Worker } from 'worker_threads'
import { defaultPaths, globPatterns } from '../utils/constants'
import { getConfigModule, globFind, join, normalizePath } from '../utils/path'

const urlPath = import.meta.url
// Url in dist/commands folder
const basePath = resolve(fileURLToPath(urlPath), '..')
const __dirname = dirname(basePath)

export const command = 'start'

export const aliases = ['serve', 'server']

export const describe = 'Start the server'

export async function handler(): Promise<void> {
  const projectPath = normalizePath(process.cwd())
  console.log('Starting the application in %s mode...', ck.bold('production'))

  let configPath = await globFind(projectPath, globPatterns.config)
  restartServer(projectPath, configPath)
}

async function restartServer(projectPath: string, configPath?: string) {
  const config = await getConfigModule(configPath)
  new Worker(join(__dirname, defaultPaths.workerApp), {
    workerData: { config, basePath: projectPath },
    env: process.env,
  })
}
