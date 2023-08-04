import crypto from 'crypto'
import fs, { existsSync } from 'fs'
import _ from 'lodash'

/**
 * Get the checksum of a file
 * If the file does not exist, return an empty string
 */
export function getChecksum(path?: string) {
  return new Promise<string>(function (resolve, reject) {
    if (!path || !existsSync(path)) return resolve('')

    const hash = crypto.createHash('md5')
    const input = fs.createReadStream(path)
    input.on('error', reject)
    input.on('data', function (chunk) {
      hash.update(chunk)
    })
    input.on('close', function () {
      resolve(hash.digest('hex'))
    })
  })
}
