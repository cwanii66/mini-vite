import type { ServerContext } from './server'
import { blue, green } from 'picocolors'
import { getShortName } from './utils'

export function bindingHMREvents(serverContext: ServerContext) {
  const { ws, watcher, root, moduleGraph } = serverContext

  watcher.on('change', async (file) => {
    console.log(`✨${blue("[hmr]")} ${green(file)} changed`)
    // 清空模块依赖图缓存
    await moduleGraph.invalidateModule(file)
    // 向客户端发送更新信息
    ws.send({
      type: 'update',
      updates: [
        {
          type: 'js-update',
          timestamp: Date.now(),
          path: '/' + getShortName(file, root),
          acceptedPath: '/' + getShortName(file, root)
        }
      ]
    })
  })
}
