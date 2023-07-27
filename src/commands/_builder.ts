import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths'
import ck from 'chalk'
import { build, context, type BuildContext } from 'esbuild'
import { existsSync, rmSync } from 'fs'
import { getTsconfig } from 'get-tsconfig'
import { defaultPaths, regexpPatterns } from '../utils/constants'
import { clearExtension, join } from '../utils/path'

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
  const appPath = join(output, defaultPaths.compiledApp)
  // Generate the absolute path for the entry file
  const absoluteEntry = join(input, entry)

  await build({
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
    plugins: [
      // Use the TsconfigPathsPlugin to enable resolution of TypeScript paths
      TsconfigPathsPlugin({
        // The tsconfig import in lib '@esbuild-plugins/tsconfig-paths' is not working
        // so we need to use the get-tsconfig package to get the tsconfig object
        tsconfig: getTsconfig(
          join(process.cwd(), config?.paths?.tsConfig || 'tsconfig.json'),
        )?.config,
      }),
      // Add a custom plugin to log the build status
      {
        name: 'InteREST',
        setup(build) {
          build.onStart(async () => {
            console.info(
              '%s Building - %s',
              ck.yellow('◉'),
              ck.bold.blue(entry),
            )
          })
          build.onEnd(() => {
            console.info('%s Done - %s', ck.green('◉'), ck.bold.blue(entry))
          })
        },
      },
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
  const appPath = join(output, defaultPaths.compiledApp)
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
      // Add a custom plugin to log the build status
      {
        name: 'InteREST',
        setup(build) {
          build.onStart(async () => {
            console.info(
              '%s Building - %s',
              ck.yellow('◉'),
              ck.bold.blue(entry),
            )
          })
          build.onEnd(() => {
            const existsEntry = existsSync(absoluteEntry)
            if (!existsEntry) {
              contextMap.get(absoluteEntry)?.dispose()
            } else {
              console.info('%s Done - %s', ck.green('◉'), ck.bold.blue(entry))
            }

            if (regexpPatterns.bootstrap.test(entry)) {
              restart?.()
            }
          })
          // Remove the compiled file when the build is disposed
          build.onDispose(async () => {
            const existsApp = existsSync(
              join(appPath, clearExtension(entry) + '.mjs'),
            )
            existsApp && rmSync(join(appPath, clearExtension(entry) + '.mjs'))
            console.info('%s Removed - %s', ck.red('◉'), ck.bold.blue(entry))

            if (regexpPatterns.bootstrap.test(entry)) {
              restart?.()
            }
          })
        },
      },
    ],
  })
  // Save the context to the map
  contextMap.set(absoluteEntry, ctx)
  // Start the build
  ctx.watch()
}
