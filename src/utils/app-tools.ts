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

function splitProperty(property: string) {
  return property.split('.').map((p) => (isNaN(+p) ? p : +p))
}

// Normalize query object
export function recursiveParse(obj: any = {}) {
  let res = Array.isArray(obj) ? ([] as any[]) : ({} as Record<string, any>)
  for (let r in obj) {
    switch (true) {
      case typeof obj[r] === 'object':
        _.set(res, splitProperty(r), recursiveParse(obj[r]))
        break
      case /^(no|n|false|f|off)$/i.test(obj[r]):
        _.set(res, splitProperty(r), false)
        break
      case /^(yes|y|true|t|on)$/i.test(obj[r]) || !obj[r]:
        _.set(res, splitProperty(r), true)
        break
      case !isNaN(+obj[r]):
        _.set(res, splitProperty(r), +obj[r])
        break
      default:
        _.set(res, splitProperty(r), obj[r])
    }
  }
  return res
}
