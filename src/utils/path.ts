import { glob } from 'glob'
import path from 'path'
import { pathToFileURL } from 'url'
import { globPatterns } from './constants'

export async function getConfigModule(configPath?: string) {
  if (!configPath) return {} as IntREST.Config
  const configURL = pathToFileURL(configPath)
  configURL.searchParams.set('update', Date.now().toString())
  return (
    (await import(configURL.toString()).then(
      (m) => m.default as IntREST.Config,
    )) || {}
  )
}

export function join(...paths: string[]) {
  return normalizePath(path.join(...paths))
}

export async function globFind(
  ...pattern: string[]
): Promise<string | undefined> {
  const res = await glob(join(...pattern), {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return res[0] && normalizePath(res[0])
}

export async function globFindList(
  ...pattern: string[][]
): Promise<string | undefined> {
  const list = pattern.map((p) => join(...p))
  const res = await glob(list, {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return res[0] && normalizePath(res[0])
}

export async function globFindAll(...pattern: string[]): Promise<string[]> {
  const res = await glob(join(...pattern), {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return res.map(normalizePath)
}

export async function globFindAllList(
  ...pattern: string[][]
): Promise<string[]> {
  const list = pattern.map((p) => join(...p))
  const res = await glob(list.reverse(), {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return res.map(normalizePath)
}

export function escapePath(path: string, escape: string) {
  return normalizePath(path)
    .replace(normalizePath(escape), '')
    .replace(/^\//, '')
}

export function normalizePath(path: string) {
  return path.replace(/[\\\/]+/g, '/').replace(/^[\/\\]*/, '')
}

export function clearExtension(path: string) {
  return normalizePath(path).replace(/\.[a-z0-9]+$/i, '')
}

export async function findEnvPaths(basePath: string) {
  return globFindAllList(...globPatterns.env.map((p) => [basePath, p]))
}

export async function getEnvPath(basePath: string) {
  return (await findEnvPaths(basePath))[0] as string | undefined
}

export async function getAppPath(basePath: string) {
  return (
    (await globFindAllList(...globPatterns.app.map((p) => [basePath, p])))[0] ||
    globPatterns.app[1]
  )
}
