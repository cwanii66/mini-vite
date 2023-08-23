import path from 'node:path'
import { build } from 'esbuild'
import { green } from 'picocolors'
import { PRE_BUNDLE_DIR } from '../constants'
import { scanPlugin } from './scanPlugin'
import { preBundlePlugin } from './preBundlePlugin'

export async function optimize(root: string) {
  // 1. 确定入口
  const entry = path.resolve(root, 'src/main.tsx')

  // 2. 扫描出用到的依赖
  const deps = new Set<string>()

  await build({
    entryPoints: [entry],
    bundle: true,
    write: false, // mock scanImports of vite
    plugins: [scanPlugin(deps)],
  })
  console.log(
    `${green('需要构建的依赖')}:\n${[...deps]
        .map(green)
        .map(i => `  ${i}`)
        .join('\n')}\n`,
  )

  // 3. 对依赖进行预构建
  await build({
    entryPoints: [...deps],
    write: true,
    bundle: true,
    format: 'esm',
    splitting: true,
    outdir: path.resolve(root, PRE_BUNDLE_DIR),
    plugins: [preBundlePlugin(deps)],
  })
}
