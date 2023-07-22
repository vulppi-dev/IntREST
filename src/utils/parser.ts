import _ from 'lodash'

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
export function parseStringBytesToNumber(
  bytes: string | number | undefined,
): number | undefined {
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
    case !isNaN(+val!):
      return +val!
    default:
      return val
  }
}
