import { createReadStream, existsSync, lstatSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Readable } from 'stream'
import { parseCompressBuffer, parseCompressStream } from '../utils/parser'

export {
  parseCompressBuffer,
  parseCompressStream,
  parseDecompressBuffer,
  parseDecompressStream,
} from '../utils/parser'

const assetsPath = join(process.cwd(), 'assets')

async function assertFileExistsAndIsAFile(path: string) {
  const exists = existsSync(path)
  if (!exists) throw new Error(`File not found: ${path}`)
  const stats = await lstatSync(path)
  if (!stats.isFile()) throw new Error(`File not found: ${path}`)
}

export async function assetsStream(
  path: string,
  compress?: IntREST.CompressEncoding,
): Promise<Readable> {
  await assertFileExistsAndIsAFile(join(assetsPath, path))

  const encoding = (compress?.split(/, */) || []) as IntREST.RequestEncoding[]
  const stream = createReadStream(join(assetsPath, path))
  return parseCompressStream(stream, encoding)
}

export async function assetsRawContent(
  path: string,
  compress?: IntREST.CompressEncoding,
): Promise<Buffer> {
  await assertFileExistsAndIsAFile(join(assetsPath, path))

  const encoding = (compress?.split(/, */) || []) as IntREST.RequestEncoding[]
  const data = readFileSync(join(assetsPath, path))

  return parseCompressBuffer(data, encoding)
}

export async function assetsContent(path: string): Promise<string> {
  return (await assetsRawContent(path)).toString()
}
