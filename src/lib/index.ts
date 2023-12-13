import {
  Stats,
  createReadStream,
  existsSync,
  lstatSync,
  readFileSync,
} from 'fs'
import { join } from 'path'
import type { Readable } from 'stream'
import { parseCompressBuffer, parseCompressStream } from '../controllers/parser'
import { getFolderPath, normalizePath } from '../controllers/path'
import { globPatterns } from '../controllers/constants'
import { buildRequestHandler } from '../controllers/request-handler'
import { tunnel } from '../controllers/tunnel'

export {
  parseCompressBuffer,
  parseCompressStream,
  parseDecompressBuffer,
  parseDecompressStream,
} from '../controllers/parser'

export * from 'http-status-codes'

async function assertFileExistsAndIsAFile(path: string) {
  const exists = existsSync(path)
  if (!exists) throw new Error(`File not found: ${path}`)
  const stats = await lstatSync(path)
  if (!stats.isFile()) throw new Error(`File not found: ${path}`)
}

interface AssetsStreamOptions {
  compress?: IntREST.CompressEncoding
}

export async function assetsStream(
  path: string,
  options?: AssetsStreamOptions,
): Promise<Readable> {
  const assetsPath = await getFolderPath(
    process.cwd(),
    globPatterns.assetsFolder,
  )
  await assertFileExistsAndIsAFile(normalizePath(join(assetsPath, path)))

  const encoding = (options?.compress?.split(/, */g) ||
    []) as IntREST.RequestEncoding[]
  const stream = createReadStream(normalizePath(join(assetsPath, path)), {
    autoClose: true,
  })
  return parseCompressStream(stream, encoding)
}

export async function assetsRawContent(
  path: string,
  compress?: IntREST.CompressEncoding,
): Promise<Buffer> {
  const assetsPath = await getFolderPath(
    process.cwd(),
    globPatterns.assetsFolder,
  )
  await assertFileExistsAndIsAFile(normalizePath(join(assetsPath, path)))

  const encoding = (compress?.split(/, */g) || []) as IntREST.RequestEncoding[]
  const data = readFileSync(normalizePath(join(assetsPath, path)))

  return parseCompressBuffer(data, encoding)
}

export async function assetsContent(path: string): Promise<string> {
  return (await assetsRawContent(path)).toString()
}

export const globalRequestHandler = buildRequestHandler(tunnel)

export async function assetsStats(path: string): Promise<Stats> {
  const assetsPath = await getFolderPath(
    process.cwd(),
    globPatterns.assetsFolder,
  )
  await assertFileExistsAndIsAFile(normalizePath(join(assetsPath, path)))

  return lstatSync(normalizePath(join(assetsPath, path)))
}
