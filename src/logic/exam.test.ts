import { describe, expect, it } from 'vitest'
import { content, getExamSpec } from '../content'
import type { Attempt } from '../storage/records'
import { allocate, formatClock, MOCK_QUESTION_COUNT, pickWeak, pickWeighted, scoreExam, weakDomains } from './exam'

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const att = (questionId: string, correct: boolean, at = '2026-11-12T00:00:00Z'): Attempt => ({ id: `${questionId}-${at}`, questionId, exam: 'clf', selected: [], correct, elapsedMs: 0, mode: 'random', sessionId: 's', answeredAt: at })

describe('模擬試験の出題', () => {
  it('65問を、公式の出題比率どおりに割り振る', () => {
    expect(allocate(getExamSpec('clf')!.domains, 65)).toEqual({ 'clf-d1': 16, 'clf-d2': 19, 'clf-d3': 22, 'clf-d4': 8 })
    expect(allocate(getExamSpec('saa')!.domains, 65)).toEqual({ 'saa-d1': 19, 'saa-d2': 17, 'saa-d3': 16, 'saa-d4': 13 })
    expect(Object.values(allocate(getExamSpec('clf')!.domains, 10)).reduce((a, b) => a + b, 0)).toBe(10)
  })

  it('公開中の問題だけで、両方の試験の模擬試験を組める（重複なし・比率どおり）', () => {
    for (const exam of ['clf', 'saa'] as const) {
      const spec = getExamSpec(exam)!
      const pool = content.questions.filter((q) => q.exam === exam)
      const plan = allocate(spec.domains, MOCK_QUESTION_COUNT)
      for (let seed = 1; seed <= 5; seed++) {
        const picked = pickWeighted(pool, spec.domains, MOCK_QUESTION_COUNT, seeded(seed))
        expect(picked).toHaveLength(65)
        expect(new Set(picked.map((q) => q.id)).size).toBe(65)
        for (const d of spec.domains) expect(picked.filter((q) => q.domainId === d.id).length, `${exam}/${d.id}`).toBe(plan[d.id])
      }
    }
  })

  it('ある分野の問題が足りないときは、ほかの分野で補う', () => {
    const pool = [
      ...Array.from({ length: 2 }, (_, i) => ({ id: `a${i}`, domainId: 'a', choices: [] })),
      ...Array.from({ length: 20 }, (_, i) => ({ id: `b${i}`, domainId: 'b', choices: [] })),
    ]
    const picked = pickWeighted(pool, [{ id: 'a', weight: 50 }, { id: 'b', weight: 50 }], 10, seeded(3))
    expect(picked).toHaveLength(10)
    expect(picked.filter((q) => q.domainId === 'a')).toHaveLength(2)
  })
})

describe('模擬試験の採点', () => {
  const qs = [
    { id: 'q1', domainId: 'd1', choices: [{ id: 'a', correct: true }, { id: 'b', correct: false }] },
    { id: 'q2', domainId: 'd1', choices: [{ id: 'a', correct: true }, { id: 'b', correct: true }, { id: 'c', correct: false }] },
    { id: 'q3', domainId: 'd2', choices: [{ id: 'a', correct: false }, { id: 'b', correct: true }] },
  ]
  it('未解答は不正解。複数選択は過不足なく選んだときだけ正解', () => {
    const s = scoreExam({ questionIds: ['q1', 'q2', 'q3', 'gone'], answers: { q1: ['a'], q2: ['a'] } }, qs, ['d1', 'd2'])
    expect(s).toMatchObject({ total: 3, correct: 1, unanswered: 1 })
    expect(s.rate).toBeCloseTo(1 / 3)
    expect(s.domains).toEqual([
      { domainId: 'd1', total: 2, correct: 1, rate: 0.5 },
      { domainId: 'd2', total: 1, correct: 0, rate: 0 },
    ])
    expect(scoreExam({ questionIds: ['q2'], answers: { q2: ['b', 'a'] } }, qs, ['d1']).correct).toBe(1)
  })
  it('残り時間の表示', () => {
    expect(formatClock(5345)).toBe('1:29:05')
    expect(formatClock(247)).toBe('4:07')
    expect(formatClock(-3)).toBe('0:00')
  })
})

describe('苦手分野演習', () => {
  const pool = [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `a${i}`, domainId: 'a', choices: [] })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, domainId: 'b', choices: [] })),
  ]
  it('履歴がなければ出題しない', () => {
    expect(pickWeak(pool, [], 10)).toEqual([])
  })
  it('最新の解答が不正解の問題を先に、次に正答率の低い分野から出す', () => {
    const attempts = [att('a0', false), att('a1', true), att('b0', true), att('b1', false, '2026-11-10T00:00:00Z'), att('b1', true, '2026-11-11T00:00:00Z')]
    const picked = pickWeak(pool, attempts, 4, seeded(1))
    expect(picked[0].id).toBe('a0')
    expect(picked.slice(1).every((q) => q.domainId === 'a')).toBe(true)
    expect(picked.map((q) => q.id)).not.toContain('b1')
    expect(weakDomains(pool, attempts).map((d) => d.domainId)).toEqual(['a', 'b'])
  })
  it('すべて正解している分野からは出さない', () => {
    expect(pickWeak(pool, [att('a0', true), att('b0', true)], 5)).toEqual([])
  })
})

describe('選択肢の並び', () => {
  it('正解の位置が、特定の場所に偏らない', () => {
    for (const exam of ['clf', 'saa'] as const) {
      const single = content.questions.filter((q) => q.exam === exam && q.select === 'single')
      const counts = [0, 0, 0, 0]
      for (const q of single) counts[q.choices.findIndex((c) => c.correct)]++
      for (const n of counts) {
        expect(n / single.length, `${exam}: ${counts.join(',')}`).toBeGreaterThan(0.15)
        expect(n / single.length, `${exam}: ${counts.join(',')}`).toBeLessThan(0.35)
      }
    }
  })
  it('並びは、何度読み込んでも同じになる', () => {
    const q = content.questions[0]
    expect(q.choices.map((c) => c.id)).toEqual([...q.choices].map((c) => c.id))
    expect(new Set(q.choices.map((c) => c.id)).size).toBe(q.choices.length)
  })
})

describe('よく似た問題を重ねない', () => {
  it('模擬試験では、同じタスクで正解も同じ問題が、できるだけ重ならない', async () => {
    const { similarKey } = await import('./exam')
    for (const exam of ['clf', 'saa'] as const) {
      const spec = getExamSpec(exam)!
      const pool = content.questions.filter((q) => q.exam === exam)
      for (let seed = 1; seed <= 5; seed++) {
        const picked = pickWeighted(pool, spec.domains, MOCK_QUESTION_COUNT, seeded(seed), similarKey)
        expect(picked).toHaveLength(65)
        const keys = picked.map(similarKey)
        // 分野の問題数が足りるかぎり、重なりは起きない（足りない分野だけ、やむをえず重なる）
        expect(keys.length - new Set(keys).size, `${exam} seed ${seed}`).toBeLessThanOrEqual(3)
      }
    }
  })
})
