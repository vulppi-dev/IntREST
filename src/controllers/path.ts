import { glob } from 'glob'
import { join, normalize } from 'path'
import { pathToFileURL } from 'url'
import { globPatterns, isDev } from './constants'

/**
 * Normalize the path and replace all backslash with slash
 *
 * @param pathname
 * @returns
 */
export function normalizePath(pathname: string) {
  return normalize(pathname).replace(/[\/\\]+/g, '/')
}

/**
 * Get the module from the given path
 * If the path is not given or the module is not found, return empty object
 */
export async function getModule(configPath?: string) {
  if (!configPath) return {} as Record<string, any>
  const configURL = pathToFileURL(configPath)
  configURL.searchParams.set('update', Date.now().toString())
  try {
    return (
      (await import(configURL.toString()).then(
        (m) => m as Record<string, any>,
      )) || {}
    )
  } catch (err) {
    return {} as Record<string, any>
  }
}

/**
 * Find the first file that match the glob pattern
 */
export async function globFind(
  ...pattern: string[]
): Promise<string | undefined> {
  const res = await glob(normalizePath(join(...pattern)), {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return res[0] && normalizePath(res[0])
}

/**
 * Find the first file that match the glob pattern list
 */
export async function globFindList(
  ...pattern: string[][]
): Promise<string | undefined> {
  const list = pattern.map((p) => normalizePath(join(...p)))
  const res = await glob(list, {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return res[0] && normalizePath(res[0])
}

/**
 * Find all files that match the glob pattern
 */
export async function globFindAll(...pattern: string[]): Promise<string[]> {
  const res = await glob(normalizePath(join(...pattern)), {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return res.map(normalizePath)
}

/**
 * Find all files that match the glob pattern list
 */
export async function globFindAllList(
  ...pattern: string[][]
): Promise<string[]> {
  const list = pattern.map((p) => normalizePath(join(...p)))
  const res = await glob(list.reverse(), {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return res.map(normalizePath)
}

/**
 * Escape the path with the given escape string
 */
export function escapePath(pathname: string, ...escape: string[]) {
  return normalizePath(pathname)
    .replace(normalizePath(join(...escape)), '')
    .replace(/^\//, '')
}

/**
 * Clear the extension of the path
 */
export function clearExtension(path: string) {
  return normalizePath(path).replace(/\.[a-z0-9]+$/i, '')
}

/**
 * Find the list of env files that match the glob pattern
 * inside the given base path
 */
export async function findEnvPaths(basePath: string) {
  return globFindAllList(...globPatterns.env.map((p) => [basePath, p]))
}

/**
 * Get the first env file that match the glob pattern
 * inside the given base path
 */
export async function getEnvPath(basePath: string) {
  return (await findEnvPaths(basePath))[0] as string | undefined
}

/**
 * Find the app folder that match the glob pattern
 * inside the given base path
 */
export async function getFolderPath(
  basePath: string,
  possibleFolders: readonly string[],
) {
  return (
    (await globFindAllList(...possibleFolders.map((p) => [basePath, p])))[0] ||
    possibleFolders[1]
  )
}

/**
 * Add the update query to the module path for development
 * to prevent the module from being cached
 */
export function encapsulateModule(v: string) {
  if (!isDev()) return v
  return `${v}?update=${Date.now()}`
}
