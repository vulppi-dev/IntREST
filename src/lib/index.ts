import {
  Stats,
  createReadStream,
  existsSync,
  lstatSync,
  readFileSync,
} from 'fs'
import { join } from 'path'
import type { Readable } from 'stream'
import { parseCompressBuffer, parseCompressStream } from '../utils/parser'
import { getFolderPath } from '../utils/path'
import { globPatterns } from '../utils/constants'
import { buildRequestHandler } from '../utils/request-handler'
import { tunnel } from '../utils/tunnel'

export {
  parseCompressBuffer,
  parseCompressStream,
  parseDecompressBuffer,
  parseDecompressStream,
} from '../utils/parser'
export * from '../utils/middleware-tools'

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
  await assertFileExistsAndIsAFile(join(assetsPath, path))

  const encoding = (options?.compress?.split(/, */g) ||
    []) as IntREST.RequestEncoding[]
  const stream = createReadStream(join(assetsPath, path), {
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
  await assertFileExistsAndIsAFile(join(assetsPath, path))

  const encoding = (compress?.split(/, */g) || []) as IntREST.RequestEncoding[]
  const data = readFileSync(join(assetsPath, path))

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
  await assertFileExistsAndIsAFile(join(assetsPath, path))

  return lstatSync(join(assetsPath, path))
}
