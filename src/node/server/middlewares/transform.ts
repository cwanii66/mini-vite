import type { NextHandleFunction } from 'connect'
import { isJSRequest, isCSSRequest, isImportRequest, cleanUrl } from '../../utils'
import type { ServerContext } from '../'
import createDebug from 'debug'

const debug = createDebug('dev')

export async function transformRequest(
  url: string,
  serverContext: ServerContext
) {
  const { moduleGraph, pluginContainer } = serverContext
  url = cleanUrl(url)
  let mod = await moduleGraph.getModuleByUrl(url)
  if (mod && mod.transformResult) {
    return mod.transformResult
  }
  // 依次调用插件容器的resolveId, load, transform
  const resolvedResult = await pluginContainer.resolveId(url)
  let transformResult
  if (resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id)
    if (typeof code === 'object' && code !== null)
      code = code.code

    const { moduleGraph } = serverContext
    await moduleGraph.ensureEntryFromUrl(url)

    if (code) {
      transformResult = await pluginContainer.transform(code, resolvedResult.id)
    }
  }
  if (mod) {
    // 缓存模块编译后的产物到对应的ModuleNode
    mod.transformResult = transformResult
  }
  return transformResult
}

export function transformMiddleware(
  serverContext: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.url)
      return next()
    
    const url = req.url
    debug('transformMiddleware: %s', url)

    // transform JS/CSS request
    if (isJSRequest(url) || isCSSRequest(url) || isImportRequest(url)) {
      // 核心编译函数
      let result = await transformRequest(url, serverContext)
      if (!result)
        return next()
      if (result && typeof result !== 'string')
        result = result.code as any
      
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/javascript')
      return res.end(result)
    }

    next()
  }
}
