import connect from 'connect'
import { blue, green } from 'picocolors'
import chokidar, { FSWatcher } from 'chokidar'
import { createWebSocketServer } from '../ws'
import { optimize } from '../optimizer'
import type { Plugin } from '../plugin'
import { ModuleGraph } from '../ModuleGraph'
import { bindingHMREvents } from '../hmr'
import { resolvePlugins } from '../plugins'
import { createPluginContainer, PluginContainer } from '../pluginContainer'
import { indexHtmlMiddleware } from './middlewares/indexHtml'
import { transformMiddleware } from './middlewares/transform'
import { staticMiddleware } from './middlewares/static'

export interface ServerContext {
  root: string
  pluginContainer: PluginContainer
  app: connect.Server
  plugins: Plugin[]
  moduleGraph: ModuleGraph
  ws: {
    send(data: any): void
    close(): void
  }
  watcher: FSWatcher
}

export async function startDevServer() {
  const app = connect()
  const root = process.cwd()
  const startTime = Date.now()

  const moduleGraph = new ModuleGraph((url) => pluginContainer.resolveId(url))
  const plugins = resolvePlugins()
  const pluginContainer = createPluginContainer(plugins)

  // 创建文件监听器
  const watcher = chokidar.watch(root, {
    ignored: ['**/node_modules/**', "**/.git/**"],
    ignoreInitial: true,
  })

  // WebSocket对象
  const ws = createWebSocketServer(app)

  const serverContext: ServerContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins,
    moduleGraph,
    ws,
    watcher
  }

  // 服务端处理HMR
  bindingHMREvents(serverContext)

  for (const plugin of plugins) {
    if (plugin.configureServer)
      await plugin.configureServer(serverContext)
  }

  app.use(indexHtmlMiddleware(serverContext))
  app.use(transformMiddleware(serverContext))
  app.use(staticMiddleware(serverContext.root))

  app.listen(3001, async () => {
    await optimize(root) // pre-bundle

    console.log(
      green('🚀 No-Bundle service has started!'),
      `taking ${Date.now() - startTime}ms`
    )
    console.log(`> local access: ${blue('http://localhost:3001')}`)
  })
}
