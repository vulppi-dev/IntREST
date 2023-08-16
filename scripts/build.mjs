import { build } from 'esbuild'
import { glob } from 'glob'
import { dirname, isAbsolute, resolve } from 'path'
import { join, normalize } from 'path/posix'
import { fileURLToPath } from 'url'

/**
 *
 * @param {string} pathname
 * @returns {string}
 */
function normalizePath(pathname) {
  return normalize(pathname).replace(/[\/\\]+/g, '/')
}

/**
 *
 * @param {string} path
 * @param {string | undefined} parent
 * @returns {Promise<string>}
 */
async function moduleResolver(path, parent = import.meta.url) {
  const safePath = /^[a-z]+:\/\//.test(path) ? fileURLToPath(path) : path
  if (isAbsolute(safePath)) {
    return resolve(safePath)
  }
  const p = dirname(fileURLToPath(parent))
  return resolve(p, safePath)
}

/**
 *
 * @param {string} path
 * @param {string} ext
 * @returns {string[]}
 */
async function getEntries(path, ext) {
  const basePath = await moduleResolver('../src')
  const entry = join(basePath, path)
  const globPath = join(entry, ext)
  return await glob(normalizePath(globPath)).then((paths) =>
    paths.map((p) => normalizePath(p.replace(basePath, ''))),
  )
}

/**
 *
 * @param {string} path
 * @returns {string}
 */
function clearExtension(path) {
  return normalizePath(path).replace(/\.[a-z0-9]+$/, '')
}

async function callBuild() {
  const index = await getEntries('lib', 'index.ts')
  const commands = await getEntries('commands', 'index.ts')
  const lib = await getEntries('workers', '*.ts')

  const entries = [...index, ...commands, ...lib].reduce(
    (acc, p) => ({
      ...acc,
      [clearExtension(p)]: join('src', p),
    }),
    {},
  )
  await build({
    entryPoints: entries,
    bundle: true,
    minify: true,
    sourcemap: true,
    packages: 'external',
    target: 'node18',
    platform: 'node',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    outdir: 'dist',
    logLevel: 'info',
  })
}

callBuild()
