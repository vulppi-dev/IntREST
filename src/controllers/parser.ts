import type { Readable } from 'stream'
import {
  createDeflate,
  createGunzip,
  createGzip,
  createInflate,
  deflate,
  gunzip,
  gzip,
  inflate,
} from 'zlib'

/**
 * Parse string bytes to number
 *  1kb = 1024 bytes
 *  1mb = 1048576 bytes
 *  1gb = 1073741824 bytes
 *  1tb = 1099511627776 bytes
 *
 * @param bytes
 * @returns
 */
export function parseStringBytesToNumber(bytes: string | number): number {
  if (typeof bytes !== 'string') return bytes

  const [, size, unit] = bytes.match(/^(\d+)([kmgt]b?)$/i) || []
  if (!size || !unit) return 0
  const sizeNumber = parseInt(size)
  if (isNaN(sizeNumber)) return 0
  switch (unit.toLowerCase()) {
    case 'tb':
      return sizeNumber * 1024 * 1024 * 1024 * 1024
    case 'gb':
      return sizeNumber * 1024 * 1024 * 1024
    case 'mb':
      return sizeNumber * 1024 * 1024
    case 'kb':
      return sizeNumber * 1024
    default:
      return sizeNumber
  }
}

/**
 * If detect string is number or boolean, parse it to number or boolean
 */
export function parseStringToAutoDetectValue(val?: string | null) {
  switch (true) {
    case val == null:
      return undefined
    case /^(no|n|false|f|off)$/i.test(val!):
      return false
    case /^(yes|y|true|t|on)$/i.test(val!):
      return true
    case !isNaN(parseFloat(val!)):
      return parseFloat(val!)
    default:
      return val
  }
}

/**
 * Decompress buffer with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export async function parseDecompressBuffer(
  data: Buffer,
  encoding: IntREST.RequestEncoding[] = ['identity'],
) {
  let buffer = data
  for (const enc of encoding) {
    if (/^gzip$/i.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        gunzip(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    } else if (/^deflate$/i.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        inflate(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    }
  }
  return buffer
}

/**
 * Compress buffer with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export async function parseCompressBuffer(
  data: Buffer,
  encoding: IntREST.RequestEncoding[] = ['identity'],
) {
  let buffer = data
  for (const enc of encoding) {
    if (/^gzip$/i.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        gzip(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    } else if (/^deflate$/i.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        deflate(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    }
  }
  return buffer
}

/**
 * Decompress stream piping with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export async function parseDecompressStream(
  data: Readable,
  encoding: IntREST.RequestEncoding[] = ['identity'],
) {
  let stream = data
  for (const enc of encoding) {
    if (/^gzip$/i.test(enc)) {
      stream = stream.pipe(createGunzip())
    } else if (/^deflate$/i.test(enc)) {
      stream = stream.pipe(createInflate())
    }
  }
  return stream
}

/**
 * Compress stream piping with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export async function parseCompressStream(
  data: Readable,
  encoding: IntREST.RequestEncoding[] = ['identity'],
) {
  let stream = data
  for (const enc of encoding) {
    if (/^gzip$/i.test(enc)) {
      stream = stream.pipe(createGzip())
    } else if (/^deflate$/i.test(enc)) {
      stream = stream.pipe(createDeflate())
    }
  }
  return stream
}
