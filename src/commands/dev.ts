import ck from 'chalk'
import dotenv, { type DotenvConfigOutput, type DotenvParseOutput } from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { existsSync, lstatSync, rmSync, watch } from 'fs'
import _ from 'lodash'
import { join } from 'path/posix'
import { Worker } from 'worker_threads'
import type { CommandBuilder } from 'yargs'
import { defaultPaths, globPatterns, regexpPatterns } from '../utils/constants'
import {
  escapePath,
  getEnvPath,
  getFolderPath,
  getModule,
  globFind,
  globFindAll,
  normalizePath,
} from '../utils/path'
import { startWatchBuild } from './_builder'
import { getChecksum } from './_common'

export const command = 'dev'

export const aliases = ['develop']

export const builder = {
  'single-worker': {
    alias: 's',
    type: 'boolean',
    default: false,
    description: 'Start the single-worker mode',
  },
} satisfies CommandBuilder

export const describe = 'Start the development server'

interface Args {
  singleWorker: boolean
}

export async function handler({ singleWorker }: Args): Promise<void> {
  // Get project root path
  const projectPath = normalizePath(process.cwd())
  console.log(
    '\nStarting the application in %s mode...',
    ck.bold.cyan('development'),
  )
  console.log('Project folder: %s\n', ck.cyan(projectPath))
  if (!process.env.NODE_ENV) {
    // @ts-ignore
    process.env.NODE_ENV = 'development'
  } else if (process.env.NODE_ENV !== 'development') {
    console.warn(
      ck.yellow(
        'The NODE_ENV environment variable is not set to "development".',
      ),
    )
  }

  // Try to find the config file
  let configPath = await globFind(projectPath, globPatterns.configFile)
  // Try to find the env file
  let envPath = await getEnvPath(projectPath)

  // Initialize the config and env checksums
  let configChecksum = await getChecksum(configPath)
  let envChecksum = await getChecksum(envPath)

  // Start application worker and watch for changes
  restartServer(projectPath, configPath, envPath, singleWorker)

  // If root dependencies (env, config) are changed, restart the application
  watch(projectPath, async (_, filename) => {
    if (!filename) return
    let changeConfig = false
    let changeEnv = false

    if (regexpPatterns.config.test(filename)) {
      // If multiple config files are found, exit the process
      const configFiles = await globFindAll(
        projectPath,
        globPatterns.configFile,
      )
      if (configFiles.length > 1) {
        console.error(ck.red('Multiple config files found.'))
        console.error(
          ck.red('Please leave one and remove the rest following files:\n'),
        )
        console.error(
          ck.red(configFiles.map((p) => escapePath(p, projectPath)).join('\n')),
        )
        console.error('\n')
        return process.exit(1)
      } else if (!configFiles.length) {
        changeConfig = true
        console.info(ck.red('The config file has removed.\n'))
      }
      configPath = configFiles[0]
    } else if (regexpPatterns.env.test(filename)) {
      const newEnvPath = await getEnvPath(projectPath)
      if (newEnvPath !== envPath) {
        envPath = newEnvPath
        changeEnv = true
      }
    }

    if (configPath) {
      const newConfigChecksum = await getChecksum(configPath)
      if (configChecksum !== newConfigChecksum) {
        configChecksum = newConfigChecksum
        changeConfig = true
        console.info('Config file changed.')
      }
    }
    if (envPath) {
      const newEnvChecksum = await getChecksum(envPath)
      if (envChecksum !== newEnvChecksum) {
        envChecksum = newEnvChecksum
        changeEnv = true
        console.info('Env file changed.')
      }
    }
    // If the config or env file is changed, restart the application
    if (changeConfig || changeEnv) {
      restartServer(projectPath, configPath, envPath, singleWorker)
    }
  })
}

let app: Worker | null = null
let debounceApp: NodeJS.Timeout | null = null
async function restartServer(
  projectPath: string,
  configPath?: string,
  envPath?: string,
  singleWorker?: boolean,
) {
  // Create debounce system to avoid multiple restarts
  let first = true
  if (debounceApp) {
    clearTimeout(debounceApp)
    debounceApp = null
  }

  // If the application is already running, terminate it and start again
  debounceApp = setTimeout(async () => {
    if (app) {
      app.terminate()
      app = null
      first = false
    }
    const config = ((await getModule(configPath)).default ||
      {}) as IntREST.Config

    // If it is the first time, start the router builder
    if (!first) {
      console.info('\n    Restarting the application...')
    } else {
      console.info('    Starting the application...\n')
      await startRouterBuilder(projectPath, config, () => {
        if (first) {
          first = false
          return
        }
        restartServer(projectPath, configPath, envPath, singleWorker)
      })
    }

    // Merge and expand the environment variables
    const myEnv = envPath
      ? dotenv.config({
          path: envPath,
          override: true,
        })
      : ({
          parsed: {},
        } as DotenvConfigOutput)

    if (!myEnv.parsed) myEnv.parsed = {} as DotenvParseOutput
    Object.assign(myEnv.parsed, _.get(config, 'env', {}))
    dotenvExpand.expand(myEnv)

    // Start the application worker
    app = new Worker(
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
          NODE_ENV: 'development',
          ...structuredClone(process.env),
          ...myEnv.parsed,
        },
      },
    )
  }, 1000)
}

async function startRouterBuilder(
  basePath: string,
  config?: IntREST.Config,
  restart?: VoidFunction,
) {
  const entryFolder = await getFolderPath(basePath, globPatterns.entryFolder)

  console.info(
    '    Application entry folder: %s\n',
    ck.cyan.bold(escapePath(entryFolder, basePath)),
  )
  // Main watcher for find new entry points and add to build context
  watch(entryFolder, { recursive: true }, async (state, filename) => {
    if (!filename || state === 'change') return
    const normalizedFilename = normalizePath(filename)
    const absolute = join(entryFolder, normalizedFilename)
    const exists = existsSync(absolute)

    // If the file is a directory, try to find the entry points
    if (exists) {
      const stat = lstatSync(absolute)
      if (stat.isDirectory()) {
        const appFiles = await globFindAll(absolute, globPatterns.entryPoints)
        return await Promise.all(
          appFiles.map(async (filename) => {
            const escapedPath = escapePath(filename, entryFolder)
            // If the file is a directory, ignore it
            const stat = lstatSync(filename)
            if (stat.isDirectory()) return
            await startWatchBuild({
              input: entryFolder,
              output: join(basePath, defaultPaths.compiledFolder),
              entry: escapedPath,
              config,
              restart,
            })
          }),
        )
      }
    }

    if (
      regexpPatterns.entry.test(normalizedFilename) ||
      regexpPatterns.bootstrap.test(normalizedFilename)
    ) {
      await startWatchBuild({
        input: entryFolder,
        output: join(basePath, defaultPaths.compiledFolder),
        entry: normalizedFilename,
        config,
        restart,
      })
    }
  })

  // Start the first build

  // Remove the old compiled folder
  const compiledFolder = join(basePath, defaultPaths.compiledFolder)
  if (existsSync(compiledFolder)) rmSync(compiledFolder, { recursive: true })

  const entryFiles = await globFindAll(entryFolder, globPatterns.entryPoints)
  const bootstrapFile = await globFind(entryFolder, globPatterns.bootstrapEntry)
  if (bootstrapFile) {
    entryFiles.push(bootstrapFile)
  }

  return Promise.all(
    entryFiles.map(async (filename) => {
      const escapedPath = escapePath(filename, entryFolder)
      // If the file is a directory, ignore it
      if (existsSync(filename)) {
        const stat = lstatSync(filename)
        if (stat.isDirectory()) return
      }
      await startWatchBuild({
        input: entryFolder,
        output: join(basePath, defaultPaths.compiledFolder),
        entry: escapedPath,
        config,
        restart,
      })
    }),
  )
}
