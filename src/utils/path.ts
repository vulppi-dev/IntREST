import { glob } from 'glob'
import path, { dirname, isAbsolute, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

export async function getConfigModule(configPath?: string) {
  if (!configPath) return {} as IntelliREST.Config
  const configURL = pathToFileURL(configPath)
  configURL.searchParams.set('update', Date.now().toString())
  return await import(configURL.toString()).then(
    (m) => m.default as IntelliREST.Config,
  )
}

export function resolveModule(path: string, parent = import.meta.url) {
  const safePath = /^[a-z]+:\/\//.test(path) ? fileURLToPath(path) : path

  if (isAbsolute(safePath)) {
    return resolve(safePath)
  }
  const p = dirname(fileURLToPath(parent))
  return resolve(p, safePath)
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
