/**
 * テスト用：Node.js から content/ 配下の教材を読み込む（アプリ本体は content/index.ts を使う）。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { validateContent } from './validate'

const root = join(import.meta.dirname, '..', '..')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return name.endsWith('.json') ? [full] : []
  })
}

const files: Record<string, unknown> = {}
for (const full of walk(join(root, 'content'))) {
  files[relative(root, full).replace(/\\/g, '/')] = JSON.parse(readFileSync(full, 'utf8'))
}

export const validation = validateContent(files, new Date().toISOString().slice(0, 10))
export const content = validation.bundle
