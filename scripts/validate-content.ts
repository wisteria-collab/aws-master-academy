/**
 * 教材データの検証スクリプト。`npm run validate` で実行する。
 * エラーが1件でもあれば終了コード1で終わり、ビルドと公開を止める。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { toLocalDate } from '../src/logic/dates.ts'
import { validateContent } from '../src/content/validate.ts'

const root = join(import.meta.dirname, '..')
const contentDir = join(root, 'content')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return name.endsWith('.json') ? [full] : []
  })
}

const files: Record<string, unknown> = {}
let parseFailed = false
for (const full of walk(contentDir)) {
  const rel = relative(root, full).replace(/\\/g, '/')
  try {
    files[rel] = JSON.parse(readFileSync(full, 'utf8'))
  } catch (e) {
    parseFailed = true
    console.error(`✖ ${rel}: JSONとして読み込めない（${(e as Error).message}）`)
  }
}

const { issues, counts } = validateContent(files, toLocalDate(new Date()))
const errors = issues.filter((i) => i.level === 'error')
const warnings = issues.filter((i) => i.level === 'warning')

for (const i of errors) console.error(`✖ ${i.file}${i.id ? ` [${i.id}]` : ''}: ${i.message}`)
for (const i of warnings) console.warn(`⚠ ${i.file}${i.id ? ` [${i.id}]` : ''}: ${i.message}`)

console.log('\n教材の件数（公開 / 未検証）')
for (const [kind, c] of Object.entries(counts)) {
  console.log(`  ${kind.padEnd(12)} ${String(c.verified).padStart(4)} / ${String(c.draft).padStart(4)}`)
}
console.log(`\nエラー ${errors.length} 件、警告 ${warnings.length} 件`)

if (errors.length > 0 || parseFailed) process.exit(1)
