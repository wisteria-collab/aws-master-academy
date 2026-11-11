import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { content } from '../content/node'
import { DexieAdapter } from '../storage/dexieAdapter'
import { grade, recordAnswer, shuffle } from './answers'
import { accuracyBy, latestAttempts } from './stats'

const single = { id: 'q1', exam: 'clf' as const, choices: [{ id: 'a', correct: false }, { id: 'b', correct: true }, { id: 'c', correct: false }, { id: 'd', correct: false }] }
const multi = { id: 'q2', exam: 'clf' as const, choices: [{ id: 'a', correct: true }, { id: 'b', correct: true }, { id: 'c', correct: false }, { id: 'd', correct: false }, { id: 'e', correct: false }] }

describe('採点', () => {
  it('択一は正解の選択肢だけを選んだときに正解', () => {
    expect(grade(single, ['b'])).toBe(true)
    expect(grade(single, ['a'])).toBe(false)
    expect(grade(single, [])).toBe(false)
  })
  it('複数選択は過不足なく選んだときだけ正解', () => {
    expect(grade(multi, ['a', 'b'])).toBe(true)
    expect(grade(multi, ['b', 'a'])).toBe(true)
    expect(grade(multi, ['a'])).toBe(false)
    expect(grade(multi, ['a', 'b', 'c'])).toBe(false)
    expect(grade(multi, ['a', 'c'])).toBe(false)
  })
  it('公開中の全問題で、正解の選択肢を選ぶと正解、それ以外の1つを選ぶと不正解になる', () => {
    expect(content.questions.length).toBeGreaterThan(0)
    for (const q of content.questions) {
      const right = q.choices.filter((c) => c.correct).map((c) => c.id)
      expect(grade(q, right), q.id).toBe(true)
      for (const c of q.choices.filter((x) => !x.correct)) expect(grade(q, [c.id]), `${q.id}:${c.id}`).toBe(false)
    }
  })
})

describe('解答の記録', () => {
  it('間違えると復習リストに入り、復習日に正解すると次の段階へ進む', async () => {
    const db = new DexieAdapter(`ans-${Math.random()}`)
    const day1 = new Date(2026, 10, 11, 10, 0)
    const a = await recordAnswer(db, { question: single, selected: ['a'], mode: 'domain', sessionId: 's', elapsedMs: 1200, now: day1 })
    expect(a.correct).toBe(false)
    expect(await db.get('reviewItems', 'q1')).toMatchObject({ dueDate: '2026-11-12', stage: 0 })

    // 同じ日に正解しても、予定は変わらない
    await recordAnswer(db, { question: single, selected: ['b'], mode: 'domain', sessionId: 's', elapsedMs: 900, now: day1 })
    expect(await db.get('reviewItems', 'q1')).toMatchObject({ dueDate: '2026-11-12', stage: 0 })

    // 復習日に正解すると3日後へ
    await recordAnswer(db, { question: single, selected: ['b'], mode: 'review', sessionId: 's2', elapsedMs: 900, now: new Date(2026, 10, 12, 9, 0) })
    expect(await db.get('reviewItems', 'q1')).toMatchObject({ dueDate: '2026-11-15', stage: 1 })
    expect(await db.getAll('attempts')).toHaveLength(3)
  })
  it('最初から正解した問題は復習リストに入らない', async () => {
    const db = new DexieAdapter(`ans-${Math.random()}`)
    await recordAnswer(db, { question: single, selected: ['b'], mode: 'lesson', sessionId: 's', elapsedMs: 10 })
    expect(await db.getAll('reviewItems')).toHaveLength(0)
  })
})

describe('集計', () => {
  const at = (questionId: string, correct: boolean, answeredAt: string) => ({
    id: `${questionId}-${answeredAt}`, questionId, exam: 'clf' as const, selected: [], correct, elapsedMs: 0, mode: 'domain' as const, sessionId: 's', answeredAt,
  })
  it('問題ごとの最新の解答で、分野・サービス別に集計する', () => {
    const attempts = [at('q1', false, '2026-11-01'), at('q1', true, '2026-11-02'), at('q2', false, '2026-11-02')]
    expect(latestAttempts(attempts)).toHaveLength(2)
    const keys: Record<string, string[]> = { q1: ['s3', 'ebs'], q2: ['s3'] }
    const r = accuracyBy(attempts, (id) => keys[id])
    expect(r.find((g) => g.key === 's3')).toMatchObject({ answered: 2, correct: 1, rate: 0.5 })
    expect(r.find((g) => g.key === 'ebs')).toMatchObject({ answered: 1, correct: 1, rate: 1 })
  })
  it('並べ替えは要素を失わない', () => {
    expect(shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5])
  })
})
