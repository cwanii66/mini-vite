import { CLIENT_PUBLIC_PATH, HMR_PORT } from '../constants'
import type { Plugin } from '../plugin'
import fse from 'fs-extra'
import path from 'node:path'
import type { ServerContext } from '../server'

export function clientInjectPlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'mini-vite:client-inject',
    configureServer(s) {
      serverContext = s
    },
    resolveId(id) {
      if (id === CLIENT_PUBLIC_PATH) {
        return { id }
      }
      return null
    },
    async load(id) {
      // 加载HMR客户端脚本
      if (id === CLIENT_PUBLIC_PATH) {
        const scriptPath = path.resolve(
          serverContext.root,
          'node_modules',
          'mini-vite',
          'dist',
          'client.mjs',
        )
        const code = await fse.readFile(scriptPath, 'utf-8')
        return {
          // 替换占位符
          code: code.replace('__HMR_PORT__', JSON.stringify(HMR_PORT))
        }
      }
    },
    transformIndexHtml(raw) {
      // 插入客户端脚本
      // 在head标签后面加上<script type="moduel" src="/@vite/client"></script>
      // 在indexHtml中间件执行transformIndexHtml钩子
      const replacedHtml = raw.replace(
        /(<head[^>]*>)/i,
        `$1<script type="module" src="${CLIENT_PUBLIC_PATH}"></script>`
      )
      return replacedHtml
    }
  }
}
