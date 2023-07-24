import ck from 'chalk'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { existsSync, lstatSync, rmSync, watch } from 'fs'
import _ from 'lodash'
import { Worker } from 'worker_threads'
import { defaultPaths, globPatterns, regexpPatterns } from '../utils/constants'
import {
  escapePath,
  getAppPath,
  getConfigModule,
  getEnvPath,
  globFind,
  globFindAll,
  join,
  normalizePath,
} from '../utils/path'
import { startWatchBuild } from './_builder'
import { getChecksum } from './_common'

export const command = 'dev'

export const aliases = ['develop']

export const describe = 'Start the development server'

export async function handler(): Promise<void> {
  // Get project root path
  const projectPath = normalizePath(process.cwd())
  console.log(
    '\nStarting the application in %s mode...',
    ck.bold.blue('development'),
  )
  console.log('Project folder: %s\n', ck.blue(projectPath))

  // Try to find the config file
  let configPath = await globFind(projectPath, globPatterns.config)
  // Try to find the env file
  let envPath = await getEnvPath(projectPath)

  // Initialize the config and env checksums
  let configChecksum = configPath ? await getChecksum(configPath) : ''
  let envChecksum = envPath ? await getChecksum(envPath) : ''

  // Start application worker and watch for changes
  restartServer(projectPath, configPath, envPath)

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
      restartServer(projectPath, configPath, envPath)
    }
  })
}

let app: Worker | null = null
let debounceApp: NodeJS.Timeout | null = null
async function restartServer(
  projectPath: string,
  configPath?: string,
  envPath?: string,
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
    const config = await getConfigModule(configPath)

    // If it is the first time, start the router builder
    if (!first) {
      console.info('Restarting the application...\n')
    } else {
      console.info('Starting the application...\n')
      await startRouterBuilder(projectPath, config)
    }

    // Merge and expand the environment variables
    const envObject = Object.assign(
      structuredClone(process.env),
      _.get(config, 'env', {}),
    ) as Record<string, string>
    const myEnv = envPath
      ? dotenv.config({
          path: envPath,
          processEnv: envObject,
          override: true,
        })
      : {
          parsed: envObject,
        }
    dotenvExpand.expand(myEnv)

    // Start the application worker
    app = new Worker(
      new URL(join('..', 'workers', defaultPaths.workerApp), import.meta.url),
      {
        env: {
          ...envObject,
          NODE_ENV: 'development',
        },
      },
    )
  }, 1000)
}

async function startRouterBuilder(basePath: string, config?: IntREST.Config) {
  const appFolder = await getAppPath(basePath)

  console.info(
    'Application path: %s',
    ck.blue.bold(escapePath(appFolder, basePath)),
  )

  watch(appFolder, { recursive: true }, async (state, filename) => {
    if (!filename || state === 'change') return
    const normalizedFilename = normalizePath(filename)
    const absolute = join(appFolder, normalizedFilename)
    const exists = existsSync(absolute)

    // If the file is a directory, ignore it
    if (exists) {
      const stat = lstatSync(absolute)
      if (stat.isDirectory()) return
    }

    if (regexpPatterns.route.test(normalizedFilename)) {
      await startWatchBuild({
        input: appFolder,
        output: join(basePath, defaultPaths.compiled),
        entry: normalizedFilename,
        config,
      })
    }
  })

  const appFiles = await globFindAll(appFolder, globPatterns.route)
  const compiledFolder = join(basePath, defaultPaths.compiled)
  if (existsSync(compiledFolder)) rmSync(compiledFolder, { recursive: true })

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
      })
    }),
  )
}
