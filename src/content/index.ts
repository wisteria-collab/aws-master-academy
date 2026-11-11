/**
 * 教材データの読み込み口。content/ 配下の JSON をビルド時にまとめて読み込み、
 * 検証を通った verified の教材だけをアプリに渡す。
 */
import { toLocalDate } from '../logic/dates'
import type { ExamId, ExamSpec } from './schema'
import { validateContent } from './validate'

const files = import.meta.glob('../../content/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

const result = validateContent(files, toLocalDate(new Date()))

if (import.meta.env.DEV) {
  for (const issue of result.issues) {
    const line = `[content] ${issue.file}${issue.id ? ` (${issue.id})` : ''}: ${issue.message}`
    if (issue.level === 'error') console.error(line)
    else console.warn(line)
  }
}

export const content = result.bundle
export const contentCounts = result.counts

export function getExamSpec(exam: ExamId): ExamSpec | undefined {
  return content.exams.find((e) => e.exam === exam)
}
