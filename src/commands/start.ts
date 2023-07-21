import ck from 'chalk'
import { Worker } from 'worker_threads'
import { defaultPaths } from '../utils/constants'
import { join, normalizePath } from '../utils/path'

export const command = 'start'

export const aliases = ['serve', 'server']

export const describe = 'Start the server'

export async function handler(): Promise<void> {
  console.log('\nStarting the application in %s mode...', ck.bold('production'))
  console.log('Project folder: %s\n', ck.blue(normalizePath(process.cwd())))
  startServer()
}

async function startServer() {
  new Worker(
    new URL(join('..', 'workers', defaultPaths.workerApp), import.meta.url),
    {
      env: process.env,
    },
  )
}
