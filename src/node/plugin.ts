import type {
  LoadResult, 
  PartialResolvedId, 
  SourceDescription, 
  ResolvedId, 
  PluginContext as RollupPluginContext 
} from 'rollup'
import { ServerContext } from './server'

export type ServerHook = (
  server: ServerContext
) => (() => void) | void | Promise<(() => void) | void>

export interface PluginContext extends RollupPluginContext {
  resolve(id: string, importer?: string): Promise<ResolvedId | null>
}

export interface Plugin {
  name: string
  configureServer?: ServerHook
  resolveId?: (
    this: PluginContext,
    id: string,
    importer?: string
  ) => Promise<PartialResolvedId | null> | PartialResolvedId | null
  load?: (this: PluginContext, id: string) => Promise<LoadResult | null> | LoadResult | null
  transform?: (
    this: PluginContext,
    code: string,
    id: string,
  ) => Promise<SourceDescription | null> | SourceDescription | null
  transformIndexHtml?: (raw: string) => Promise<string> | string
}
