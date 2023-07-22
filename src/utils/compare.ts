import {
  isAnyArrayBuffer,
  isUint16Array,
  isUint32Array,
  isUint8Array,
} from 'util/types'

export function isBuffer(data: any): data is Buffer {
  if (isAnyArrayBuffer(data)) return true
  if (isUint8Array(data)) return true
  if (isUint16Array(data)) return true
  if (isUint32Array(data)) return true

  return false
}
