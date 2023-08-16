import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths'
import ck from 'chalk'
import { build, context, type BuildContext, type Plugin } from 'esbuild'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { getTsconfig } from 'get-tsconfig'
import { dirname, join } from 'path/posix'
import { defaultPaths, regexpPatterns } from '../utils/constants'
import { clearExtension, escapePath, normalizePath } from '../utils/path'
import { parseRoutePathnameToRegexp } from '../utils/response'

interface StartBuildProps {
  input: string
  output: string
  entry: string
  config?: IntREST.Config
  restart?: VoidFunction
}

export async function callBuild({
  input,
  output,
  entry,
  config,
}: StartBuildProps) {
  // Generate the output path for the compiled app
  const appPath = join(output, defaultPaths.compiledRoutes)
  // Generate the absolute path for the entry file
  const absoluteEntry = join(input, entry)

  await build({
    entryPoints: {
      [clearExtension(entry)]: absoluteEntry,
    },
    bundle: true,
    minify: true,
    packages: 'external',
    target: 'node18',
    platform: 'node',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    outdir: appPath,
    plugins: [
      // Use the TsconfigPathsPlugin to enable resolution of TypeScript paths
      TsconfigPathsPlugin({
        // The tsconfig import in lib '@esbuild-plugins/tsconfig-paths' is not working
        // so we need to use the get-tsconfig package to get the tsconfig object
        tsconfig: getTsconfig(
          normalizePath(
            join(process.cwd(), config?.paths?.tsConfig || 'tsconfig.json'),
          ),
        )?.config,
      }),
      IntRESTPlugin({ entry, absoluteEntry, input, output }),
    ],
  })
}

const contextMap = new Map<string, BuildContext>()

export async function startWatchBuild({
  input,
  output,
  entry,
  config,
  restart,
}: StartBuildProps) {
  // Generate the output path for the compiled app
  const appPath = join(output, defaultPaths.compiledRoutes)
  // Generate the absolute path for the entry file
  const absoluteEntry = join(input, entry)
  // If the entry file is already being watched, do nothing
  if (contextMap.has(absoluteEntry)) {
    return
  }

  const ctx = await context({
    entryPoints: {
      [clearExtension(entry)]: absoluteEntry,
    },
    bundle: true,
    minify: false,
    packages: 'external',
    target: 'node18',
    platform: 'node',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    outdir: appPath,
    logLevel: 'silent',
    plugins: [
      // Use the TsconfigPathsPlugin to enable resolution of TypeScript paths
      TsconfigPathsPlugin({
        // The tsconfig import in lib '@esbuild-plugins/tsconfig-paths' is not working
        // so we need to use the get-tsconfig package to get the tsconfig object
        tsconfig: getTsconfig(
          join(process.cwd(), config?.paths?.tsConfig || 'tsconfig.json'),
        )?.config,
      }),
      IntRESTPlugin({
        entry,
        absoluteEntry,
        input,
        output,
        restart,
      }),
    ],
  })
  // Save the context to the map
  contextMap.set(absoluteEntry, ctx)
  // Start the build
  ctx.watch()
}

interface IntRESTPluginProps {
  entry: string
  absoluteEntry: string
  input: string
  output: string
  restart?: VoidFunction
}

/**
 * Restart is only to bootstrap files,
 * because they are running in main worker
 */
function IntRESTPlugin({
  entry,
  absoluteEntry,
  input,
  output,
  restart,
}: IntRESTPluginProps) {
  return {
    name: 'InteREST',
    setup(build) {
      build.onStart(async () => {
        console.info('%s Building - %s', ck.yellow('◉'), ck.bold.cyan(entry))
      })
      build.onResolve(
        { filter: regexpPatterns.observable },
        async ({ path, kind }) => {
          if (kind !== 'entry-point') return null

          const identityFilePath = join(
            escapePath(path, input).replace(/\/?route\.ts$/, ''),
            defaultPaths.routeIdentity,
          )
          const absoluteIdentityFilePath = join(
            output,
            defaultPaths.compiledRoutes,
            identityFilePath,
          )
          const dir = dirname(absoluteIdentityFilePath)
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
          }

          writeFileSync(
            absoluteIdentityFilePath,
            getRouteIdentity(path, input),
            {
              flag: 'w+',
            },
          )
          return null
        },
      )
      build.onEnd(async () => {
        const existsEntry = existsSync(absoluteEntry)
        if (!existsEntry) {
          return contextMap.get(absoluteEntry)?.dispose()
        } else {
          console.info('%s Done - %s', ck.green('◉'), ck.bold.cyan(entry))
        }

        if (regexpPatterns.bootstrap.test(entry)) {
          restart?.()
        }
      })
      // Remove the compiled file when the build is disposed
      build.onDispose(async () => {
        if (!restart) return
        const existsApp = existsSync(
          join(output, clearExtension(entry) + '.mjs'),
        )

        existsApp &&
          rmSync(
            join(
              output,
              defaultPaths.compiledRoutes,
              clearExtension(entry) + '.mjs',
            ),
          )
        console.info('%s Removed - %s', ck.red('◉'), ck.bold.cyan(entry))

        const identityFilePath = join(
          entry.replace(/\/?route\.ts$/, ''),
          defaultPaths.routeIdentity,
        )
        const existsIdentity = existsSync(
          join(output, defaultPaths.compiledRoutes, identityFilePath),
        )
        existsIdentity && rmSync(join(output, identityFilePath))

        if (regexpPatterns.bootstrap.test(entry)) {
          restart()
        }
      })
    },
  } satisfies Plugin
}

function getRouteIdentity(path: string, input: string) {
  const regexpValues = parseRoutePathnameToRegexp(path, input)
  const contents = [] as string[]
  contents.push(`export const paramExtract = ${regexpValues.paramRegexp};`)
  contents.push(
    `export const paramKeys = ${JSON.stringify(regexpValues.vars)};`,
  )
  contents.push(
    `export const pathname = "${escapePath(regexpValues.pathname, input)
      .replace(/\/?route\.ts$/, '')
      .replace(/^\/*/, '/')}";`,
  )
  contents.push(`export const route = "${regexpValues.route}";`)

  return contents.join('\n')
}
