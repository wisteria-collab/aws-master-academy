// 教材（content/）の検証を、アプリを開くたびではなくビルドのときに1回だけ行う Vite のプラグイン。
// 検証を通った教材だけを1つのデータにまとめて、アプリに渡す（virtual:content-bundle）。
// スマホで初めて開いたときの処理が軽くなる。
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { validateContent } from '../src/content/validate'

const ID = 'virtual:content-bundle'
const RESOLVED = '\0' + ID

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function contentBundle(): Plugin {
  const root = resolve(__dirname, '..')
  const dir = join(root, 'content')
  const load = () => {
    const files: Record<string, unknown> = {}
    const walk = (d: string) => {
      for (const name of readdirSync(d)) {
        const p = join(d, name)
        if (statSync(p).isDirectory()) walk(p)
        // キーは、以前の import.meta.glob と同じ形（src/content から見た相対パス）にそろえる
        else if (name.endsWith('.json')) files['../../' + relative(root, p).split('\\').join('/')] = JSON.parse(readFileSync(p, 'utf8'))
      }
    }
    walk(dir)
    return validateContent(files, today())
  }
  return {
    name: 'content-bundle',
    resolveId: (id) => (id === ID ? RESOLVED : undefined),
    load(id) {
      if (id !== RESOLVED) return
      const result = load()
      const errors = result.issues.filter((i) => i.level === 'error')
      if (errors.length) this.error(`教材の検証でエラーが ${errors.length} 件あります（npm run validate で確認）`)
      // JSON.parse に渡すと、大きなデータでもJavaScriptとして解釈するより速く読み込める
      const data = JSON.stringify({ bundle: result.bundle, counts: result.counts, issues: result.issues })
      return `export default JSON.parse(${JSON.stringify(data)})`
    },
    configureServer(server) {
      server.watcher.add(dir)
      server.watcher.on('change', (file) => {
        if (!file.startsWith(dir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}
