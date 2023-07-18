import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths'
import ck from 'chalk'
import { build, context, type BuildContext } from 'esbuild'
import { getTsconfig } from 'get-tsconfig'
import { defaultPaths } from '../utils/constants'
import { clearExtension, join } from '../utils/path'
import { existsSync, rmSync } from 'fs'

interface StartBuildProps {
  input: string
  output: string
  entry: string
  config?: IntREST.Config
}

export async function callBuild({
  input,
  output,
  entry,
  config,
}: StartBuildProps) {
  const appPath = join(output, defaultPaths.compiledApp)
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
      TsconfigPathsPlugin({
        tsconfig: getTsconfig(
          join(process.cwd(), config?.paths?.tsConfig || 'tsconfig.json'),
        )?.config,
      }),
      {
        name: 'InteREST',
        setup(build) {
          build.onStart(() => {
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
}: StartBuildProps) {
  const appPath = join(output, defaultPaths.compiledApp)
  const absoluteEntry = join(input, entry)
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
      TsconfigPathsPlugin({
        tsconfig: getTsconfig(
          join(process.cwd(), config?.paths?.tsConfig || 'tsconfig.json'),
        )?.config,
      }),
      {
        name: 'InteREST',
        setup(build) {
          build.onStart(() => {
            console.info('%s Building - %s', ck.green('◉'), ck.bold.blue(entry))
          })
          build.onEnd((res) => {
            const existsEntry = existsSync(absoluteEntry)
            if (!existsEntry) {
              contextMap.get(absoluteEntry)?.dispose()
            } else {
              console.info('%s Done - %s', ck.green('◉'), ck.bold.blue(entry))
            }
          })
          build.onDispose(() => {
            const existsApp = existsSync(
              join(appPath, clearExtension(entry) + '.mjs'),
            )
            existsApp && rmSync(join(appPath, clearExtension(entry) + '.mjs'))
            console.info('%s Removed - %s', ck.red('◉'), ck.bold.blue(entry))
          })
        },
      },
    ],
  })
  contextMap.set(absoluteEntry, ctx)
  ctx.watch()
}
