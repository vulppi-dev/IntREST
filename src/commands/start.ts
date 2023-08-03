import ck from 'chalk'
import { Worker } from 'worker_threads'
import { defaultPaths } from '../utils/constants'
import { join, normalizePath } from '../utils/path'
import type { CommandBuilder } from 'yargs'

export const command = 'start'

export const aliases = ['serve', 'server']

export const builder = {
  serverless: {
    alias: 's',
    type: 'boolean',
    default: false,
    description: 'Start the serverless mode',
  },
} satisfies CommandBuilder

export const describe = 'Start the server'

interface Args {
  serverless: boolean
}

export async function handler({ serverless }: Args): Promise<void> {
  console.log('\nStarting the application in %s mode...', ck.bold('production'))
  console.log('Project folder: %s\n', ck.cyan(normalizePath(process.cwd())))
  if (!process.env.NODE_ENV) {
    // @ts-ignore
    process.env.NODE_ENV = 'production'
  }
  startServer(serverless)
}

async function startServer(serverless?: boolean) {
  new Worker(
    new URL(
      join(
        '..',
        'workers',
        serverless ? defaultPaths.workerServerless : defaultPaths.workerApp,
      ),
      import.meta.url,
    ),
    {
      env: {
        NODE_ENV: 'production',
        ...process.env,
      },
    },
  )
}
