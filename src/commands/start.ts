import ck from 'chalk'
import { join } from 'path'
import type { CommandBuilder } from 'yargs'
import { defaultPaths, globPatterns } from '../controllers/constants'
import { getModule, globFind, normalizePath } from '../controllers/path'

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
  const projectPath = normalizePath(process.cwd())
  const configPath = await globFind(projectPath, globPatterns.configFile)
  const config = ((await getModule(configPath)).default || {}) as IntREST.Config

  const httpVersion = config.httpVersion || 1
  const url = new URL(
    normalizePath(
      join(
        '..',
        'workers',
        'v' +
          httpVersion +
          '-' +
          (singleWorker
            ? defaultPaths.workerSingleWorker
            : defaultPaths.workerMultiWorker),
      ),
    ),
    import.meta.url,
  )
  await import(url.toString())
}
