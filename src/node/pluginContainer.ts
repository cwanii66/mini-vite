import type {
  LoadResult,
  PartialResolvedId,
  SourceDescription,
  ResolvedId,
} from 'rollup'
import type { Plugin, PluginContext } from './plugin'

export interface PluginContainer {
  resolveId(id: string, importer?: string): Promise<PartialResolvedId | null>
  load(id: string): Promise<LoadResult | null>
  transform(code: string, id: string): Promise<SourceDescription | null>
}

export function createPluginContainer(plugins: Plugin[]): PluginContainer {
  // 插件上下文对象
  // @ts-ignore (only implement resolve)
  class Context implements PluginContext {
    async resolve(id: string, importer?: string) {
      let out = await pluginContainer.resolveId(id, importer)
      if (typeof out === 'string')
        out = { id: out }
      return out as ResolvedId | null
    }
  }

  const pluginContainer: PluginContainer = {
    async resolveId(id: string, importer?: string) {
      const ctx = new Context() as any
      for (const plugin of plugins) {
        if (plugin.resolveId) {
          const newId = await plugin.resolveId.call(ctx, id, importer)
          if (newId) {
            id = typeof newId === 'string' ? newId : newId.id
            return { id }
          }
        }
      }
      return null
    },
    async load(id) {
      const ctx = new Context() as any
      for (const plugin of plugins) {
        if (plugin.load) {
          const loadResult = await plugin.load.call(ctx, id)
          if (loadResult)
            return loadResult
        }
      }
      return null
    },
    async transform(code, id) {
      const ctx = new Context() as any
      for (const plugin of plugins) {
        if (plugin.transform) {
          const source = await plugin.transform.call(ctx, code, id)
          if (!source) continue
          if (typeof source === 'string')
            code = source
          else if (source.code)
            code = source.code
        }
      }
      return { code } // transformed code, otherwise loaded code directly
    },
  }

  return pluginContainer
}
