import { readFile } from 'fs-extra'
import type { Plugin } from '../plugin'

export function cssPlugin(): Plugin {
  return {
    name: 'mini-vite:css',
    load(id) {
      if (id.endsWith('.css')) {
        return readFile(id, 'utf-8')
      }
    },
    // css tranform logic
    transform(code, id) {
      if (id.endsWith('.css')) {
        // 包装成JS模块
        const jsContent = `
          const css = '${code.replace(/\n/g, '')}';
          const style = document.createElement("style");
          style.setAttribute("type", "text/css");
          style.innerHTML = css;
          document.head.appendChild(style);
          export default css;
        `.trim()
        return {
          code: jsContent
        }
      }
      return null
    }
  }
}
