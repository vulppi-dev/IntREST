import ck from 'chalk'
import { Worker } from 'worker_threads'
import { defaultPaths } from '../utils/constants'
import { join, normalizePath } from '../utils/path'
import type { CommandBuilder } from 'yargs'

export const command = 'start'

export const aliases = ['serve', 'server']

export const builder = {
  'single-worker': {
    alias: 's',
    type: 'boolean',
    default: false,
    description: 'Start the single-worker mode',
  },
} satisfies CommandBuilder

export const describe = 'Start the server'

interface Args {
  singleWorker: boolean
}

export async function handler({ singleWorker }: Args): Promise<void> {
  console.log('\nStarting the application in %s mode...', ck.bold('production'))
  console.log('Project folder: %s\n', ck.cyan(normalizePath(process.cwd())))
  if (!process.env.NODE_ENV) {
    // @ts-ignore
    process.env.NODE_ENV = 'production'
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn(
      ck.yellow(
        'The NODE_ENV environment variable is not set to "production".',
      ),
    )
  }
  startServer(singleWorker)
}

async function startServer(singleWorker?: boolean) {
  new Worker(
    new URL(
      join(
        '..',
        'workers',
        singleWorker
          ? defaultPaths.workerSingleWorker
          : defaultPaths.workerMultiWorker,
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
