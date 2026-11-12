/**
 * 模擬試験と、出題の選び方の計算。
 * 成績は「アプリ独自の正答率」で表す。本番のスケールドスコア（100〜1000）とは対応しない。
 */
import type { Attempt, ExamAttempt } from '../storage/records'
import { grade, shuffle, type Gradable } from './answers'
import { accuracy, latestAttempts } from './stats'

export const MOCK_QUESTION_COUNT = 65

export interface DomainWeight {
  id: string
  weight: number
}
export interface ExamQuestion extends Gradable {
  id: string
  domainId: string
}

/**
 * よく似た問題（同じタスクで、正解も同じもの）が1回の出題に重ならないよう、並べ替える。
 * それぞれのグループの1問目を先に並べ、2問目以降は後ろへ回す（問題が足りないときだけ使われる）。
 */
function spread<Q>(list: Q[], keyOf?: (q: Q) => string): Q[] {
  if (!keyOf) return list
  const seen = new Set<string>()
  const first: Q[] = []
  const later: Q[] = []
  for (const q of list) {
    const k = keyOf(q)
    if (seen.has(k)) later.push(q)
    else {
      seen.add(k)
      first.push(q)
    }
  }
  return [...first, ...later]
}

/** 同じタスクで、正解の選択肢も同じ問題は、よく似た問題とみなす */
export function similarKey(q: { taskId?: string; domainId: string; choices: { text: string; correct: boolean }[] }): string {
  return `${q.taskId ?? q.domainId}|${q.choices.filter((c) => c.correct).map((c) => c.text).sort().join('/')}`
}

/** 合計 total 問を、分野の出題比率どおりに割り振る（端数は、余りの大きい分野から1問ずつ足す） */
export function allocate(domains: DomainWeight[], total: number): Record<string, number> {
  const sum = domains.reduce((a, d) => a + d.weight, 0)
  if (sum === 0) return Object.fromEntries(domains.map((d) => [d.id, 0]))
  const exact = domains.map((d) => ({ id: d.id, value: (total * d.weight) / sum }))
  const out = Object.fromEntries(exact.map((e) => [e.id, Math.floor(e.value)]))
  let rest = total - Object.values(out).reduce((a, b) => a + b, 0)
  for (const e of [...exact].sort((a, b) => (b.value % 1) - (a.value % 1))) {
    if (rest <= 0) break
    out[e.id]++
    rest--
  }
  return out
}

/**
 * 分野の出題比率に合わせて、count 問を選ぶ。
 * ある分野の問題が足りないときは、ほかの分野の問題で補う。最後に全体を並べ替える。
 */
export function pickWeighted<Q extends ExamQuestion>(pool: readonly Q[], domains: DomainWeight[], count: number, random: () => number = Math.random, similarKey?: (q: Q) => string): Q[] {
  const plan = allocate(domains, Math.min(count, pool.length))
  const picked: Q[] = []
  const rest: Q[] = []
  for (const d of domains) {
    const list = spread(shuffle(pool.filter((q) => q.domainId === d.id), random), similarKey)
    picked.push(...list.slice(0, plan[d.id]))
    rest.push(...list.slice(plan[d.id]))
  }
  const known = new Set(domains.map((d) => d.id))
  rest.push(...pool.filter((q) => !known.has(q.domainId)))
  const need = Math.min(count, pool.length) - picked.length
  if (need > 0) picked.push(...shuffle(rest, random).slice(0, need))
  return shuffle(picked, random)
}

export interface DomainScore {
  domainId: string
  total: number
  correct: number
  rate: number | null
}
export interface ExamScore {
  total: number
  correct: number
  unanswered: number
  rate: number
  domains: DomainScore[]
  /** 問題ごとの結果（出題順） */
  items: { questionId: string; selected: string[]; correct: boolean; answered: boolean }[]
}

/** 模擬試験を採点する。未解答は不正解として数える */
export function scoreExam(attempt: Pick<ExamAttempt, 'questionIds' | 'answers'>, questions: readonly ExamQuestion[], domainOrder: string[]): ExamScore {
  const byId = new Map(questions.map((q) => [q.id, q]))
  const items = attempt.questionIds.flatMap((id) => {
    const q = byId.get(id)
    if (!q) return []
    const selected = attempt.answers[id] ?? []
    return [{ questionId: id, domainId: q.domainId, selected, answered: selected.length > 0, correct: selected.length > 0 && grade(q, selected) }]
  })
  const domains = domainOrder.map((domainId) => {
    const list = items.filter((i) => i.domainId === domainId)
    const correct = list.filter((i) => i.correct).length
    return { domainId, total: list.length, correct, rate: list.length === 0 ? null : correct / list.length }
  })
  const correct = items.filter((i) => i.correct).length
  return {
    total: items.length,
    correct,
    unanswered: items.filter((i) => !i.answered).length,
    rate: items.length === 0 ? 0 : correct / items.length,
    domains,
    items: items.map(({ questionId, selected, correct: ok, answered }) => ({ questionId, selected, correct: ok, answered })),
  }
}

/** 残り時間の表示（例：1:29:05、または 4:07） */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/**
 * 苦手分野演習の出題。
 * ①いちばん最近の解答が不正解だった問題 → ②正答率の低い分野の問題（未解答を先に）の順で選ぶ。
 * 解答の履歴がないときは、何も出題しない（苦手がまだ分からないため）。
 */
export function pickWeak<Q extends ExamQuestion>(pool: readonly Q[], attempts: Attempt[], count: number, random: () => number = Math.random): Q[] {
  const ids = new Set(pool.map((q) => q.id))
  const latest = latestAttempts(attempts.filter((a) => ids.has(a.questionId)))
  if (latest.length === 0) return []
  const state = new Map(latest.map((a) => [a.questionId, a.correct]))
  const wrong = shuffle(pool.filter((q) => state.get(q.id) === false), random)

  const domainOf = new Map(pool.map((q) => [q.id, q.domainId]))
  const rates = [...new Set(pool.map((q) => q.domainId))]
    .map((d) => ({ d, acc: accuracy(latest.filter((a) => domainOf.get(a.questionId) === d)) }))
    .filter((x) => x.acc.rate !== null)
    .sort((a, b) => (a.acc.rate ?? 0) - (b.acc.rate ?? 0))
  const picked = [...wrong]
  for (const { d, acc } of rates) {
    if (picked.length >= count) break
    if ((acc.rate ?? 1) >= 1) continue
    const inDomain = pool.filter((q) => q.domainId === d && state.get(q.id) !== false)
    const unanswered = shuffle(inDomain.filter((q) => !state.has(q.id)), random)
    const answered = shuffle(inDomain.filter((q) => state.has(q.id)), random)
    picked.push(...[...unanswered, ...answered])
  }
  return picked.slice(0, count)
}

/** 分野ごとの最新の正答率（低い順）。解答のない分野は含めない */
export function weakDomains(pool: readonly ExamQuestion[], attempts: Attempt[]): { domainId: string; rate: number; answered: number }[] {
  const domainOf = new Map(pool.map((q) => [q.id, q.domainId]))
  const latest = latestAttempts(attempts.filter((a) => domainOf.has(a.questionId)))
  return [...new Set(pool.map((q) => q.domainId))]
    .map((domainId) => ({ domainId, ...accuracy(latest.filter((a) => domainOf.get(a.questionId) === domainId)) }))
    .filter((x): x is typeof x & { rate: number } => x.rate !== null)
    .map(({ domainId, rate, answered }) => ({ domainId, rate, answered }))
    .sort((a, b) => a.rate - b.rate)
}
