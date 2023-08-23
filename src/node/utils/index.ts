import os from 'node:os'
import path from 'node:path'
import { 
  HASH_RE, 
  JS_TYPES_RE, 
  QEURY_RE,
  FS_PREFIX,
  VALID_ID_PREFIX,
  CLIENT_PUBLIC_PATH,
  ENV_PUBLIC_PATH
} from '../constants'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export const isWindows = os.platform() === 'win32'

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

const replaceSlashOrColonRE = /[/:]/g
const replaceDotRE = /\./g
const replaceNestedIdRE = /(\s*>\s*)/g
const replaceHashRE = /#/g
export const flattenId = (id: string): string =>
  id
    .replace(replaceSlashOrColonRE, '_')
    .replace(replaceDotRE, '__')
    .replace(replaceNestedIdRE, '___')
    .replace(replaceHashRE, '____')

export function isImportRequest(url: string): boolean {
  return url.endsWith('?import')
}
export function isCSSRequest(id: string): boolean {
  return cleanUrl(id).endsWith('.css')
}
export function isJSRequest(id: string): boolean {
  id = cleanUrl(id)
  if (JS_TYPES_RE.test(id))
    return true
  if (!path.extname(id) && !id.endsWith('/'))
    return true
  return false
}

const internalPrefixes = [
  FS_PREFIX,
  VALID_ID_PREFIX,
  CLIENT_PUBLIC_PATH,
  ENV_PUBLIC_PATH,
]
const InternalPrefixRE = new RegExp(`^(?:${internalPrefixes.join('|')})`)
export function isInternalRequest(url: string): boolean {
  return InternalPrefixRE.test(url)
}

export function cleanUrl(url: string): string {
  return url.replace(HASH_RE, '').replace(QEURY_RE, '')
}

export function getShortName(file: string, root: string): string {
  return file.startsWith(root + '/') ? path.posix.relative(root, file) : file
}
export function removeImportQuery(url: string): string {
  return url.replace(/\?import$/, '')
}
