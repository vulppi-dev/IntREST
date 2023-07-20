import ck from 'chalk'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { Worker } from 'worker_threads'
import { defaultPaths } from '../utils/constants'
import { join } from '../utils/path'

export const command = 'start'

export const aliases = ['serve', 'server']

export const describe = 'Start the server'

export async function handler(): Promise<void> {
  console.log(
    '\nStarting the application in %s mode...\n',
    ck.bold('production'),
  )
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
