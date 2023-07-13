import _ from 'lodash'

export function parseStringBytesToNumber(
  bytes: string | number | undefined,
): number | undefined {
  if (typeof bytes !== 'string') return bytes

  const [, size, unit] = bytes.match(/^(\d+)([kmg]b?)$/i) || []
  if (!size || !unit) return 0
  const sizeNumber = parseInt(size)
  if (isNaN(sizeNumber)) return 0
  switch (unit.toLowerCase()) {
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

export function parseStringToAutoDetectValue(val?: string | null) {
  switch (true) {
    case !val:
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
