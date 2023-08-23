import resolve from 'resolve'
import type { Plugin } from '../plugin'
import type { ServerContext } from '../server'
import path from 'node:path'
import { pathExists } from 'fs-extra'
import { DEFAULT_EXTENSIONS } from '../constants'
import { normalizePath, cleanUrl, removeImportQuery } from '../utils'

export function resolvePlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'mini-vite:resolve',
    configureServer(s) {
      // 保存服务端上下文对象
      serverContext = s
    },
    async resolveId(id: string, importer?: string) {
      id = removeImportQuery(cleanUrl(id)) // 处理资源import url
      // 1. 绝对路径
      if (path.isAbsolute(id)) {
        if (await pathExists(id))
          return { id }
        // 加上root路径前缀，处理/src/main.tsx的情况
        id = path.join(serverContext.root, id)
        if (await pathExists(id))
          return { id }
      }
      else if (id.startsWith('.')) { // 2.相对路径
        if (!importer)
          throw new Error('`importer` should not be undefined')

        const hasExtension = path.extname(id).length > 1
        let resolvedId: string
        // 2.1 包含文件名后缀 如：./App.tsx
        if (hasExtension) {
          resolvedId = normalizePath(resolve.sync(id, { basedir: path.dirname(importer) }))
          if (await pathExists(resolvedId))
            return { id: resolvedId }
        }
        // 2.2 不包含文件后缀名 如：./App
        else {
          // ./App -> ./App.tsx
          for (const extname of DEFAULT_EXTENSIONS) {
            try {
              const withExtension = `${id}${extname}`
              resolvedId = normalizePath(resolve.sync(
                withExtension,
                { basedir: path.dirname(importer) }
              ))
              if (await pathExists(resolvedId))
                return { id: resolvedId }
            } catch(e) {
              continue
            }
          }
        }
      }
      return null
    },
  }
}
