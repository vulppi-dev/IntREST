import ck from 'chalk'
import dotenv, { type DotenvConfigOutput, type DotenvParseOutput } from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { existsSync, lstatSync, rmSync, watch } from 'fs'
import _ from 'lodash'
import { Worker } from 'worker_threads'
import { defaultPaths, globPatterns, regexpPatterns } from '../utils/constants'
import {
  escapePath,
  getAppPath,
  getModule,
  getEnvPath,
  globFind,
  globFindAll,
  join,
  normalizePath,
} from '../utils/path'
import { startWatchBuild } from './_builder'
import { getChecksum } from './_common'
import type { CommandBuilder } from 'yargs'

export const command = 'dev'

export const aliases = ['develop']

export const builder = {
  serverless: {
    alias: 's',
    type: 'boolean',
    default: false,
    description: 'Start the serverless mode',
  },
} satisfies CommandBuilder

export const describe = 'Start the development server'

interface Args {
  serverless: boolean
}

export async function handler({ serverless }: Args): Promise<void> {
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
  }

  // Try to find the config file
  let configPath = await globFind(projectPath, globPatterns.config)
  // Try to find the env file
  let envPath = await getEnvPath(projectPath)

  // Initialize the config and env checksums
  let configChecksum = configPath ? await getChecksum(configPath) : ''
  let envChecksum = envPath ? await getChecksum(envPath) : ''

  // Start application worker and watch for changes
  restartServer(projectPath, configPath, envPath, serverless)

  // If root dependencies (env, config) are changed, restart the application
  watch(projectPath, async (_, filename) => {
    if (!filename) return
    let changeConfig = false
    let changeEnv = false

    if (regexpPatterns.config.test(filename)) {
      // If multiple config files are found, exit the process
      const configFiles = await globFindAll(projectPath, globPatterns.config)
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
    if (changeConfig || changeEnv) {
      restartServer(projectPath, configPath, envPath, serverless)
    }
  })
}

let app: Worker | null = null
let debounceApp: NodeJS.Timeout | null = null
async function restartServer(
  projectPath: string,
  configPath?: string,
  envPath?: string,
  serverless?: boolean,
) {
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
        restartServer(projectPath, configPath, envPath, serverless)
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
          serverless ? defaultPaths.workerServerless : defaultPaths.workerApp,
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
  const appFolder = await getAppPath(basePath)

  console.info(
    '    Application path: %s\n',
    ck.cyan.bold(escapePath(appFolder, basePath)),
  )
  watch(appFolder, { recursive: true }, async (state, filename) => {
    if (!filename || state === 'change') return
    const normalizedFilename = normalizePath(filename)
    const absolute = join(appFolder, normalizedFilename)
    const exists = existsSync(absolute)

    // If the file is a directory, ignore it
    if (exists) {
      const stat = lstatSync(absolute)
      if (stat.isDirectory()) {
        const appFiles = await globFindAll(
          appFolder,
          filename,
          globPatterns.points,
        )

        return await Promise.all(
          appFiles.map(async (filename) => {
            const escapedPath = escapePath(filename, appFolder)
            // If the file is a directory, ignore it
            if (existsSync(filename)) {
              const stat = lstatSync(filename)
              if (stat.isDirectory()) return
            }
            await startWatchBuild({
              input: appFolder,
              output: join(basePath, defaultPaths.compiled),
              entry: escapedPath,
              config,
              restart,
            })
          }),
        )
      }
    }

    if (
      regexpPatterns.route.test(normalizedFilename) ||
      regexpPatterns.bootstrap.test(normalizedFilename)
    ) {
      await startWatchBuild({
        input: appFolder,
        output: join(basePath, defaultPaths.compiled),
        entry: normalizedFilename,
        config,
        restart,
      })
    }
  })

  const compiledFolder = join(basePath, defaultPaths.compiled)
  if (existsSync(compiledFolder)) rmSync(compiledFolder, { recursive: true })

  const appFiles = await globFindAll(appFolder, globPatterns.points)
  const bootstrapFile = await globFind(appFolder, globPatterns.bootstrap)
  if (bootstrapFile) {
    appFiles.push(bootstrapFile)
  }

  return Promise.all(
    appFiles.map(async (filename) => {
      const escapedPath = escapePath(filename, appFolder)
      // If the file is a directory, ignore it
      if (existsSync(filename)) {
        const stat = lstatSync(filename)
        if (stat.isDirectory()) return
      }
      await startWatchBuild({
        input: appFolder,
        output: join(basePath, defaultPaths.compiled),
        entry: escapedPath,
        config,
        restart,
      })
    }),
  )
}
