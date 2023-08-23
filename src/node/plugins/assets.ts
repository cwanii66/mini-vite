import { pathExists, readFile } from 'fs-extra'
import type { Plugin } from '../plugin'
import type { ServerContext } from '../server'
import { normalizePath, getShortName } from '../utils'

export function assetsPlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'mini-vite:assets',
    configureServer(s) {
      serverContext = s
    },
    async load(id) {
      const resolvedId = `/${getShortName(normalizePath(id), serverContext.root)}`

      // 这里仅处理svg
      if (id.endsWith('.svg')) {
        return {
          code: `export default "${resolvedId}"`
        }
      }
    },
  }
}
