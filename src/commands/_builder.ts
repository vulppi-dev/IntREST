import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths'
import ck from 'chalk'
import { build, context, type BuildContext, type Plugin } from 'esbuild'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { getTsconfig } from 'get-tsconfig'
import {
  defaultPaths,
  defaultVariables,
  globPatterns,
  regexpPatterns,
} from '../utils/constants'
import {
  clearExtension,
  encapsulateModule,
  escapePath,
  globFindAll,
  join,
} from '../utils/path'
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
      build.onLoad({ filter: regexpPatterns.observable }, async ({ path }) => {
        const exists = existsSync(path)
        if (!exists) {
          return null
        }

        const regexpValues = parseRoutePathnameToRegexp(path, input)
        const contents = [readFileSync(path).toString()] as string[]
        contents.push(
          `export const ${defaultVariables.paramExtract} = ${regexpValues.paramRegexp};`,
        )
        contents.push(
          `export const ${defaultVariables.paramKeys} = ${JSON.stringify(
            regexpValues.vars,
          )};`,
        )
        contents.push(
          `export const ${defaultVariables.pathname} = "${escapePath(
            regexpValues.pathname,
            input,
          )
            .replace(/\/?route\.ts$/, '')
            .replace(/^\/*/, '/')}";`,
        )
        contents.push(
          `export const ${defaultVariables.route} = "${regexpValues.route}";`,
        )

        return {
          loader: 'ts',
          contents: contents.join('\n'),
        }
      })
      build.onEnd(async () => {
        const existsEntry = existsSync(absoluteEntry)
        if (!existsEntry) {
          return contextMap.get(absoluteEntry)?.dispose()
        } else {
          await refreshRoutesMap(output)
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
          join(input, clearExtension(entry) + '.mjs'),
        )
        existsApp && rmSync(join(input, clearExtension(entry) + '.mjs'))
        console.info('%s Removed - %s', ck.red('◉'), ck.bold.cyan(entry))

        if (regexpPatterns.bootstrap.test(entry)) {
          restart()
        }
      })
    },
  } satisfies Plugin
}

let debounceRouteMap: NodeJS.Timeout | null = null
let clearRouteMap: VoidFunction | null = null

async function refreshRoutesMap(output: string) {
  if (clearRouteMap) {
    clearRouteMap()
    clearRouteMap = null
  }

  return new Promise<void>((resolve) => {
    clearRouteMap = () => {
      if (debounceRouteMap) {
        clearTimeout(debounceRouteMap)
        debounceRouteMap = null
      }
      resolve()
    }

    debounceRouteMap = setTimeout(async () => {
      const allRoutes = await globFindAll(output, '**', globPatterns.routeFile)
      const allMiddlewares = await globFindAll(
        output,
        '**',
        globPatterns.middlewareFile,
      )

      const escapedRoutes = allRoutes.map((route) => escapePath(route, output))
      const escapedMiddlewares = allMiddlewares.map((middleware) =>
        escapePath(middleware, output),
      )

      const contents: string[] = ['// Auto generated by InteREST']
      contents.push(
        escapedRoutes
          .map(
            (route, i) =>
              `import * as _${i} from './${encapsulateModule(route)}'`,
          )
          .join('\n') + '\n',
      )
      contents.push(
        escapedMiddlewares
          .map(
            (middleware, i) =>
              `import * as _m_${i} from './${encapsulateModule(middleware)}'`,
          )
          .join('\n') + '\n',
      )

      contents.push('const rs = [')
      contents.push(escapedRoutes.map((_, i) => `_${i}`).join(', '))
      contents.push(']')
      contents.push('const ms = {')
      contents.push(
        escapedMiddlewares
          .map(
            (m, i) =>
              `  "${escapePath(m, output)
                .replace(/\/?middleware\.mjs$/, '')
                .replace(/^\/?routes\/?/, '')
                .replace(/^\/*/, '/')}": _m_${i},`,
          )
          .join('\n'),
      )
      contents.push('}')
      contents.push(routesFunction)
      contents.push(
        `export { ${defaultVariables.getHandlers}, ${defaultVariables.getMiddlewares} }`,
      )

      writeFileSync(join(output, defaultPaths.routesMap), contents.join('\n'), {
        flag: 'w+',
      })
      resolve()
    }, 50)
  })
}

const routesFunction = `
function ${defaultVariables.getHandlers}(route) {
  return rs.filter((r) => r.${defaultVariables.paramExtract}.test(route))
    .sort(sortCompiledRoutes)
}

function ${defaultVariables.getMiddlewares}(pathname) {
  const pathnames = pathname.split('/').map((_, i, l) => i > 0 ? l.slice(0, i + 1).join('/') : '/');
  return pathnames.map((p) => ({ handler: ms[p]?.middleware, pathname: p})).filter((m) => typeof m.handler === 'function')
}

function sortCompiledRoutes(a, b) {
  const aSlipt = a.${defaultVariables.pathname}.split('/');
  const bSlipt = b.${defaultVariables.pathname}.split('/');
  for (let i = 0; i < aSlipt.length; i++) {
    if (aSlipt[i][0] === '[' && bSlipt[i]?.[0] === '[') continue;
    if (aSlipt[i][0] === '[') return 1;
    if (bSlipt[i]?.[0] === '[') return -1;
  }
  if (b.${defaultVariables.route}.toLowerCase() > a.${defaultVariables.route}.toLowerCase()) return -1;
  if (b.${defaultVariables.route}.toLowerCase() < a.${defaultVariables.route}.toLowerCase()) return 1;
  return b.${defaultVariables.pathname}.length - a.${defaultVariables.pathname}.length;
}
`
