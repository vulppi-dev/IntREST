import crypto from 'crypto'
import fs, { existsSync } from 'fs'
import _ from 'lodash'

export function normalizeConfig(config: Vulppi.KitConfig): Vulppi.KitConfig {
  const normalConfig = structuredClone(config)

  if (!_.get(normalConfig, ['folders', 'appFolder'])) {
    _.set(normalConfig, ['folders', 'appFolder'], 'app')
  }

  return normalConfig
}

export function getChecksum(path: string) {
  return new Promise<string>(function (resolve, reject) {
    if (!existsSync(path)) return resolve('')

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
