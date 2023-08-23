import { init, parse } from 'es-module-lexer'
import {
  BARE_IMPORT_RE,
  CLIENT_PUBLIC_PATH,
  PRE_BUNDLE_DIR
} from '../constants'
import {
  cleanUrl,
  isJSRequest,
  isInternalRequest,
  normalizePath,
  getShortName
} from '../utils'
import MagicString from 'magic-string'
import path from 'node:path'
import type { Plugin } from '../plugin'
import type { ServerContext } from '../server'
import { pathExists } from 'fs-extra'
import resolve from 'resolve'

export function importAnalysisPlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'mini-vite:import-analysis',
    configureServer(s) {
      serverContext = s
    },
    async transform(code, id) {
      if (!isJSRequest(id) || isInternalRequest(id))
        return null
      await init
      // 解析import语句
      const [imports] = parse(code)
      const ms = new MagicString(code)

      const resolve = async (id: string, importer?: string) => {
        const resolved = await this.resolve(
          id,
          normalizePath(importer!)
        )
        if (!resolved)
          return
        const cleanedId = cleanUrl(resolved.id)
        const mod = moduleGraph.getModuleById(cleanedId)
        let resolvedId = `/${getShortName(resolved.id, serverContext.root)}`
    
        if (mod && mod.lastHMRTimestamp > 0) // identify hot module id
          resolvedId += '?t=' + mod.lastHMRTimestamp
      
        return resolvedId
      }

      const { moduleGraph } = serverContext
      const curMod = moduleGraph.getModuleById(id)!
      const importedModules = new Set<string>()

      // 对每个import语句依次进行分析
      for (const importSpecifier of imports) {
        const { s, e, n: modSource } = importSpecifier
        if (!modSource) continue

        // 静态资源
        if (modSource.endsWith('.svg')) {
          // 加上 ?import后缀
          const resolvedUrl = path.join(path.dirname(id), modSource)
          ms.overwrite(s, e, `${resolvedUrl}?import`)
          continue
        }

        // 第三方库：路径重写到预构建产物的路径
        if (BARE_IMPORT_RE.test(modSource)) {
          const bundlePath = normalizePath(
            path.resolve(serverContext.root, PRE_BUNDLE_DIR, `${modSource}.js`)
          )
          ms.overwrite(s, e, bundlePath)

          importedModules.add(bundlePath)
        }
        else if (modSource.startsWith('.') || modSource.startsWith('/')) {
          // 直接调用插件上下文的resolve方法，自动经过路径解析插件的处理
          const resolved = await resolve(modSource, id)
          if (resolved) {
            ms.overwrite(s, e, resolved)
            importedModules.add(resolved)
          }
        }
      }

      // 只对业务代码注入hot context
      if (!id.includes('node_modules')) {
        ms.prepend(
          `import { createHotContext as __mvite__createHotContext } from '${CLIENT_PUBLIC_PATH}';\n`
            +
          `import.meta.hot = __mvite__createHotContext(${JSON.stringify(
            cleanUrl(curMod.url)
          )});\n`
        )
      }

      // 模块依赖关系绑定
      moduleGraph.updateModuleInfo(curMod, importedModules)

      return {
        code: ms.toString(),
        // 生成sourcemap
        map: ms.generateMap(),
      }
    }
  }
}
