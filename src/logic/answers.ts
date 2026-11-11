/**
 * 解答の採点と記録。解答履歴を保存し、復習の予定を更新する。
 */
import type { StorageAdapter } from '../storage/adapter'
import type { Attempt } from '../storage/records'
import { toLocalDate } from './dates'
import { nextReview } from './review'

/** 選んだ選択肢が、正解の選択肢と過不足なく一致していれば正解 */
/** 採点に必要な最小限の問題の形 */
export interface Gradable {
  choices: { id: string; correct: boolean }[]
}

export function grade(question: Gradable, selected: readonly string[]): boolean {
  const correct = question.choices.filter((c) => c.correct).map((c) => c.id)
  const chosen = new Set(selected)
  return chosen.size === correct.length && correct.every((id) => chosen.has(id))
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export interface AnswerInput {
  question: Gradable & { id: string; exam: Attempt['exam'] }
  selected: string[]
  mode: Attempt['mode']
  sessionId: string
  elapsedMs: number
  now?: Date
}

export async function recordAnswer(adapter: StorageAdapter, input: AnswerInput): Promise<Attempt> {
  const now = input.now ?? new Date()
  const correct = grade(input.question, input.selected)
  const attempt: Attempt = {
    id: newId(),
    questionId: input.question.id,
    exam: input.question.exam,
    selected: [...input.selected],
    correct,
    elapsedMs: Math.max(0, Math.round(input.elapsedMs)),
    mode: input.mode,
    sessionId: input.sessionId,
    answeredAt: now.toISOString(),
  }
  await adapter.put('attempts', attempt)

  const current = await adapter.get('reviewItems', input.question.id)
  const update = nextReview(current, input.question.id, correct, toLocalDate(now), now.toISOString())
  if (update.action === 'put') await adapter.put('reviewItems', update.item)
  if (update.action === 'remove') await adapter.remove('reviewItems', input.question.id)
  return attempt
}

/** 配列をランダムに並べ替えた新しい配列を返す */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
