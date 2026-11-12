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

/** 文字列から、並べ替え用の数値を作る（毎回同じ結果になる） */
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * 選択肢の並び順を、問題ごとに決まった順序で入れ替える。
 * 教材のデータでは正解を先頭に書いているため、そのまま表示すると「正解はいつも1番目」になってしまう。
 * 並びは問題IDから決まるので、解答中・振り返り・再読み込みで順序が変わることはない。
 */
export function arrangeChoices<C extends { id: string }>(questionId: string, choices: readonly C[]): C[] {
  return [...choices].sort((a, b) => hash(`${questionId}:${a.id}`) - hash(`${questionId}:${b.id}`) || a.id.localeCompare(b.id))
}

export const content = {
  ...result.bundle,
  questions: result.bundle.questions.map((q) => ({ ...q, choices: arrangeChoices(q.id, q.choices) })),
}
export const contentCounts = result.counts

export function getExamSpec(exam: ExamId): ExamSpec | undefined {
  return content.exams.find((e) => e.exam === exam)
}
