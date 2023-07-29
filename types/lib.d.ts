import type { Readable } from 'stream'

/**
 * The function to get the read stream of a file
 *
 * @param path The path of the file
 * @param compress The encoding to compress the file
 */
export function assetsStream(
  path: string,
  compress?: IntREST.CompressEncoding,
): Promise<Readable>
/**
 * The function to get the raw content of a file
 *
 * @param path The path of the file
 */
export function assetsRawContent(
  path: string,
  compress?: IntREST.CompressEncoding,
): Promise<Buffer>
/**
 * The function to get the string content of a file
 *
 * @param path The path of the file
 */
export function assetsContent(path: string): Promise<string>

/**
 * Decompress buffer with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export function parseDecompressBuffer(
  data: Buffer,
  encoding?: IntREST.RequestEncoding[],
): Promise<Buffer>

/**
 * Compress buffer with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export function parseCompressBuffer(
  data: Buffer,
  encoding?: IntREST.RequestEncoding[],
): Promise<Buffer>

/**
 * Decompress stream piping with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export function parseDecompressStream(
  data: Readable,
  encoding?: IntREST.RequestEncoding[],
): Promise<Readable>

/**
 * Compress stream piping with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export function parseCompressStream(
  data: Readable,
  encoding?: IntREST.RequestEncoding[],
): Promise<Readable>
