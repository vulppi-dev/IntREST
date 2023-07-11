import { dirname } from 'path'
import { parentPort } from 'worker_threads'
import { defaultPaths } from '../utils/constants'
import {
  escapePath,
  globFindAll,
  globFindAllList,
  join,
  normalizePath,
} from '../utils/path'

export function sendResponse(res: Vulppi.ResponseMessage): never {
  parentPort?.postMessage(res)
  return process.exit(0)
}

export async function findMiddlewarePathnames(
  basePath: string,
  routeFilePath: string,
) {
  const dir = dirname(
    escapePath(routeFilePath, join(basePath, defaultPaths.compiledApp)),
  )
  const directories = recursiveDirectoryList(dir)
  const searchList = directories.map((r) =>
    [basePath, defaultPaths.compiledApp, r, 'middleware.mjs'].filter(Boolean),
  )

  return await globFindAllList(...searchList)
}

export async function findRoutePathname(basePath: string, route: string) {
  const routesPathnames = await globFindAll(
    basePath,
    defaultPaths.compiledApp,
    '**/route.mjs',
  )
  const routes = routesPathnames.map((r) => {
    const escapedRoute = escapePath(r, join(basePath, defaultPaths.compiledApp))
    return escapedRoute
      .replace(/[\/\\]?\([a-z0-1]+\)/gi, '')
      .replace(/route\.mjs$/, '')
      .replace(/\/*$/, '')
      .replace(/^\/*/, '/')
  })
  const indexes = routes.map((r, i) => (r === route ? i : -1))
  return routesPathnames
    .map((r, i) => (indexes[i] >= 0 ? r : null))
    .filter(Boolean) as string[]
}

export function recursiveDirectoryList(path: string) {
  const dirs = normalizePath(path)
    .split('/')
    .map((_, i, arr) => arr.slice(0, i + 1).join('/'))
  if (!dirs.includes('')) dirs.unshift('')
  return dirs
}
