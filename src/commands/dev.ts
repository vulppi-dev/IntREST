import ck from 'chalk'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { existsSync, rmSync, watch } from 'fs'
import _ from 'lodash'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { Worker } from 'worker_threads'
import { defaultPaths, globPatterns, regexpPatterns } from '../utils/constants'
import {
  escapePath,
  findEnvPaths,
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

const urlPath = import.meta.url
// Url in dist/commands folder
const basePath = resolve(fileURLToPath(urlPath), '..')
const __dirname = dirname(basePath)

export const command = 'dev'

export const aliases = ['develop']

export const describe = 'Start the development server'

export async function handler(): Promise<void> {
  const projectPath = normalizePath(process.cwd())
  console.log('Starting the application in %s mode...', ck.bold('development'))

  let configPath = await globFind(projectPath, globPatterns.config)
  let envPath = await getEnvPath(projectPath)

  let configChecksum = configPath ? await getChecksum(configPath) : ''
  let envChecksum = envPath ? await getChecksum(envPath) : ''

  restartServer(projectPath, configPath, envPath)

  watch(projectPath, async (_, filename) => {
    if (!filename) return
    if (regexpPatterns.config.test(filename)) {
      const configFiles = await globFindAll(projectPath, globPatterns.config)
      if (configFiles.length > 1) {
        console.log(ck.red('Multiple config files found.'))
        console.log(
          ck.red('Please leave one and remove the rest following files:'),
        )
        console.log(
          ck.red(configFiles.map((p) => escapePath(p, projectPath)).join('\n')),
        )
        return
      } else if (!configFiles.length) {
        console.log(ck.red('The config file has removed.'))
        return
      }
      configPath = configFiles[0]
    } else if (regexpPatterns.env.test(filename)) {
      const envFiles = await findEnvPaths(projectPath)
      if (envFiles.length > 1) {
        console.log(ck.red('Multiple env files found.'))
        console.log(
          ck.red('Please leave one and remove the rest following files:'),
        )
        console.log(
          ck.red(envFiles.map((p) => escapePath(p, projectPath)).join('\n')),
        )
        return
      } else if (envPath && !envFiles.length) {
        console.log(ck.red('The env file has removed.'))
      }
      envPath = envFiles[0]
    }
    let changeConfig = false
    let changeEnv = false

    if (configPath) {
      const newConfigChecksum = await getChecksum(configPath)
      if (configChecksum !== newConfigChecksum) {
        configChecksum = newConfigChecksum
        changeConfig = true
        console.log('Config file changed.')
      }
    }
    if (envPath) {
      const newEnvChecksum = await getChecksum(envPath)
      if (envChecksum !== newEnvChecksum) {
        envChecksum = newEnvChecksum
        changeEnv = true
        console.log('Env file changed.')
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

  debounceApp = setTimeout(async () => {
    if (app) {
      app.terminate()
      app = null
      first = false
    }
    const config = await getConfigModule(configPath)

    if (!first) {
      console.log('Restarting the application...')
    } else {
      console.log('Starting the application...')
      await startRouterBuilder(projectPath, config)
    }

    const envObject = Object.assign(
      structuredClone(process.env),
      { INTREST_BASE_PATH: projectPath },
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
    app = new Worker(join(__dirname, defaultPaths.workerApp), {
      env: envObject,
    })
  }, 1000)
}

async function startRouterBuilder(basePath: string, config?: IntREST.Config) {
  const appFolder = await getAppPath(basePath)

  console.log(
    'Application path: %s',
    ck.blue.bold(escapePath(appFolder, basePath)),
  )

  watch(appFolder, { recursive: true }, async (state, filename) => {
    if (!filename || state === 'change') return
    const normalizedFilename = normalizePath(filename)

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
      await startWatchBuild({
        input: appFolder,
        output: join(basePath, defaultPaths.compiled),
        entry: escapedPath,
        config,
      })
    }),
  )
}
