console.log('[mini-vite] connecting...');

interface Update {
  type: 'js-update' | 'css-update'
  timestamp: number
  path: string
  acceptedPath: string
}

// 1. 创建WebSocket实例
// __HMR_PORT__之后会被no-bundle服务编译成具体的端口号
const socket = new WebSocket(`ws://localhost:__HMR_PORT__`, 'vite-hmr')

// 2. 接收服务端的更新信息
socket.addEventListener('message', ({ data }) => {
  handleMessage(JSON.parse(data)).catch(console.error)
})

// 3. 根据不同的更新类型进行处理
async function handleMessage(payload: any) {
  switch(payload.type) {
    case 'connected':
      console.log('[mini-vite] connected.')
      // 心跳检测
      setInterval(() => socket.send('ping'), 1000)
      break
    
    case 'update':
      payload.updates.forEach((update: Update) => {
        if (update.type === 'js-update') {
          queueUpdate(fetchUpdate(update))
        }
      })
      break
  }
}

interface HotModule {
  id: string
  callbacks: HotCallback[]
}
interface HotCallback {
  deps: string[]
  fn: (modules: object[]) => void
}
interface HotContext {
  accept(deps: any, callback?: any): void
  prune(cb: (data: any) => void): void
}

// HMR模块表
const hotModulesMap = new Map<string, HotModule>()
// 不再生效的模块表
const pruneMap = new Map<string, (data: any) => void | Promise<void>>()

export function createHotContext(ownerPath: string): HotContext {
  const mod = hotModulesMap.get(ownerPath)
  if (mod) {
    mod.callbacks = []
  }

  function acceptDeps(deps: string[], callback: HotCallback['fn']) {
    const mod: HotModule = hotModulesMap.get(ownerPath) || {
      id: ownerPath,
      callbacks: []
    }
    // callbacks存放accept的依赖，依赖改动后对应的回调
    mod.callbacks.push({
      deps,
      fn: callback
    })
    hotModulesMap.set(ownerPath, mod)
  }

  const hot: HotContext = {
    accept(deps: any, callback?: any) {
      // 这里仅考虑接受自身模块更新的情况
      if (typeof deps === 'function' || !deps) {
        acceptDeps([ownerPath], ([mod]) => deps?.(mod))
      }
      else {
        throw new Error(`invalid hot.accept() usage.`)
      }
    },
    // 模块不再生效的回调
    // import.meta.hot.prune(() => {})
    prune(cb: (data: any) => void) {
      pruneMap.set(ownerPath, cb)
    }
  }

  return hot
}

let pending = false
let queued: Promise<(() => void) | undefined>[] = []
/**
 * buffer multiple hot updates triggered by the same src change
 * so that they are invoked in the same order they were sent.
 * (otherwise the order may be inconsistent because of the http request round trip)
 */
async function queueUpdate(p: Promise<(() => void) | undefined>) {
  queued.push(p)
  if (!pending) {
    pending = true
    await Promise.resolve()
    pending = false
    const loading = [...queued]
    queued = []
    ;(await Promise.all(loading)).forEach((fn) => fn?.())
  }
}

async function fetchUpdate({ path, timestamp }: Update) {
  const mod = hotModulesMap.get(path)
  if (!mod) return

  const moduleMap = new Map()
  const modulesToUpdate = new Set<string>()
  modulesToUpdate.add(path)

  await Promise.all(
    Array.from(modulesToUpdate).map(async (dep) => {
      const [path, query] = dep.split('?')
      try {
        // 通过动态import拉取最新模块
        const newMod = await import(
          path + `?t=${timestamp}${query ? `&${query}` : ''}`
        )
        // 记录更新模块
        moduleMap.set(dep, newMod)
      } catch(e) {}
    })
  )

  return () => {
    // 拉取最新模块后执行更新回调
    for (const { deps, fn } of mod.callbacks) {
      fn(deps.map(dep => moduleMap.get(dep)))
    }
    console.log(`[mini-vite] hot updated: ${path}`)
  }
}
