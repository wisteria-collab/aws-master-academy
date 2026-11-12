// ビルド後に実行し、dist の全ファイルを保存する Service Worker（dist/sw.js）を作る。
// 版ごとにキャッシュ名を変えるので、新しい版を公開すると古い保存分は消える。
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const dist = new URL('../dist/', import.meta.url).pathname
const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name !== 'sw.js') files.push(relative(dist, p).split('\\').join('/'))
  }
}
walk(dist)
files.sort()
const hash = createHash('sha256')
for (const f of files) hash.update(f).update(readFileSync(join(dist, f)))
const version = hash.digest('hex').slice(0, 12)

const sw = `// 自動生成（scripts/make-sw.mjs）。手で編集しない
const CACHE = 'ama-${version}'
const FILES = ${JSON.stringify(['./', ...files.map((f) => './' + f)])}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ama-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  // 画面の入口（HTML）は、つながるときは新しいものを取り、つながらないときは保存分を使う
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('./index.html', { cacheName: CACHE }).then((r) => r || caches.match('./'))))
    return
  }
  // それ以外（名前に版が入ったファイル）は、保存分を先に使う
  // 配信側が Vary ヘッダーを付けていても保存分を使えるよう、ヘッダーの違いは無視する
  event.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit || fetch(req)))
})
`
writeFileSync(join(dist, 'sw.js'), sw)
console.log(`sw.js を作成: ${files.length} ファイル, 版 ${version}`)
