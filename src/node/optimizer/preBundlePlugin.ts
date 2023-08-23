// 用来分析es模块import/export语句的库
import path from 'node:path'
import { init, parse } from 'es-module-lexer'
import type { Loader, Plugin } from 'esbuild'

// 实现了node路径解析算法的库
import resolve from 'resolve'
import fse from 'fs-extra'

// 用来开发打印debug日志的库
import createDebug from 'debug'
import { BARE_IMPORT_RE } from '../constants'
import { normalizePath } from '../utils'

const debug = createDebug('dev')

export function preBundlePlugin(deps: Set<string>): Plugin {
  return {
    name: 'esbuild:prebundle',
    setup(build) {
      build.onResolve(
        ({ filter: BARE_IMPORT_RE }),
        (resolveInfo) => {
          const { path: id, importer } = resolveInfo
          const isEntry = !importer
          if (deps.has(id)) {
            return isEntry
              ? {
                  path: id,
                  namespace: 'dep',
                }
              : {
                  path: resolve.sync(id, { basedir: process.cwd() }),
                }
          }
        },
      )

      // 拿到标记后dep后的依赖，构造代理模块，交给esbuild打包
      build.onLoad(
        {
          filter: /.*/,
          namespace: 'dep',
        },
        async (loadInfo) => {
          await init
          const id = loadInfo.path
          const root = process.cwd()
          const entryPath = normalizePath(resolve.sync(id, { basedir: root }))
          const code = await fse.readFile(entryPath, 'utf-8')
          const [imports, exports] = parse(code)
          const proxyModule: string[] = []

          // cjs
          if (!imports.length && !exports.length) {
            const res = require(entryPath)
            const specifiers = Object.keys(res)
            proxyModule.push(
              `export { ${specifiers.join(',')} } from '${entryPath}'`,
              `export default require('${entryPath}')`,
            )
          }
          else { // esm
            for (const { n: name } of exports) {
              if (name === 'default')
                proxyModule.push(`import d from '${entryPath}'; export default d;`)
            }
            proxyModule.push(`export * from '${entryPath}'`)
          }
          debug('代理模块内容: %o', proxyModule.join('\n'))

          const loader = path.extname(entryPath).slice(1)
          return {
            loader: loader as Loader,
            contents: proxyModule.join('\n'),
            resolveDir: root,
          }
        },
      )
    },
  }
}
