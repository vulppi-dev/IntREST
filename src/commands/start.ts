import ck from 'chalk'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { Worker } from 'worker_threads'
import { defaultPaths } from '../utils/constants'
import { join } from '../utils/path'

const urlPath = import.meta.url
// Url in dist/commands folder
const basePath = resolve(fileURLToPath(urlPath), '..')
const __dirname = dirname(basePath)

export const command = 'start'

export const aliases = ['serve', 'server']

export const describe = 'Start the server'

export async function handler(): Promise<void> {
  console.log(
    '\nStarting the application in %s mode...\n',
    ck.bold('production'),
  )
  restartServer()
}

async function restartServer() {
  new Worker(join(__dirname, defaultPaths.workerApp), {
    env: process.env,
  })
}
