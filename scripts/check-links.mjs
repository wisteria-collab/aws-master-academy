// 教材（content/）に載っている公式リンクを、すべて開いて確かめる。
// GitHub Actions で週に1回と、手動で実行する（.github/workflows/link-check.yml）。
// 結果は link-report.md に書き出し、開けなかったリンクがあれば終了コード1で終わる。
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('../content/', import.meta.url).pathname
const found = new Map() // url -> 使っているファイル
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (name.endsWith('.json')) {
      for (const m of readFileSync(p, 'utf8').matchAll(/https?:\/\/[^"\s)]+/g)) {
        const url = m[0]
        if (!found.has(url)) found.set(url, new Set())
        found.get(url).add(p.slice(root.length))
      }
    }
  }
}
walk(root)

const UA = 'Mozilla/5.0 (compatible; aws-master-academy-link-check)'
async function check(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) })
      res.body?.cancel()
      return { status: res.status, finalUrl: res.url }
    } catch (e) {
      if (attempt === 1) return { status: 0, error: String(e?.cause?.code ?? e?.name ?? e) }
    }
  }
}

const urls = [...found.keys()].sort()
const results = []
const queue = [...urls]
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const url = queue.shift()
      results.push({ url, ...(await check(url)) })
    }
  }),
)

// 403・429 は、自動の確認を断っているだけのことが多いので「要確認」に分ける
const broken = results.filter((r) => r.status === 404 || r.status === 410 || (r.status >= 500) || r.status === 0)
const unsure = results.filter((r) => r.status === 403 || r.status === 429 || (r.status >= 400 && r.status < 500 && ![404, 410, 403, 429].includes(r.status)))
const ok = results.length - broken.length - unsure.length
const line = (r) => `- ${r.url}（${r.status || r.error}）— ${[...found.get(r.url)].slice(0, 3).join(', ')}${found.get(r.url).size > 3 ? ' ほか' : ''}`
const report = [
  `# 公式リンクの点検結果（${new Date().toISOString().slice(0, 10)}）`,
  '',
  `- 確認したリンク：${results.length}件`,
  `- 開けた：${ok}件`,
  `- 開けなかった（リンク切れの可能性）：${broken.length}件`,
  `- 要確認（自動の確認を断られた可能性）：${unsure.length}件`,
  '',
  '## 開けなかったリンク',
  ...(broken.length ? broken.map(line) : ['なし']),
  '',
  '## 要確認のリンク',
  ...(unsure.length ? unsure.map(line) : ['なし']),
  '',
].join('\n')
writeFileSync('link-report.md', report)
console.log(report)
process.exit(broken.length ? 1 : 0)
