import type { Plugin } from '../plugin'
import { assetsPlugin } from './assets'
import { cssPlugin } from './css'
import { esbuildTransformPlugin } from './esbuild'
import { importAnalysisPlugin } from './importAnalysis'
import { resolvePlugin } from './resolve'
import { clientInjectPlugin } from './clientInject'

export function resolvePlugins(): Plugin[] {
  return [
    clientInjectPlugin(),
    resolvePlugin(), 
    esbuildTransformPlugin(), 
    importAnalysisPlugin(), 
    cssPlugin(), 
    assetsPlugin()
  ]
}
