import { describe, expect, it } from 'vitest'
import { addDays, formatDuration, lastDays, toLocalDate } from './dates'
import { dueItems, nextReview } from './review'
import { accuracy, formatRate, summarizeStudyTime } from './stats'

const now = '2026-11-11T01:00:00.000Z'

describe('dates', () => {
  it('ローカル日付を返し、月またぎの加算ができる', () => {
    expect(toLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(lastDays('2026-11-03', 3)).toEqual(['2026-11-01', '2026-11-02', '2026-11-03'])
  })
  it('学習時間を表示用に整える', () => {
    expect(formatDuration(59)).toBe('0分')
    expect(formatDuration(3660)).toBe('1時間1分')
  })
})

describe('復習スケジュール', () => {
  const today = '2026-11-11'
  it('間違えたら翌日に再出題する', () => {
    const r = nextReview(undefined, 'q1', false, today, now)
    expect(r).toEqual({ action: 'put', item: { questionId: 'q1', dueDate: '2026-11-12', stage: 0, streak: 0, updatedAt: now } })
  })
  it('復習リストにない問題に正解しても何もしない', () => {
    expect(nextReview(undefined, 'q1', true, today, now)).toEqual({ action: 'none' })
  })
  it('復習で正解するたびに 3日 → 7日 → 14日 と広がり、最後は外れる', () => {
    let item = { questionId: 'q1', dueDate: today, stage: 0, streak: 0, updatedAt: now }
    const days = []
    for (;;) {
      const r = nextReview(item, 'q1', true, item.dueDate, now)
      if (r.action !== 'put') {
        expect(r.action).toBe('remove')
        break
      }
      days.push(r.item.dueDate)
      item = r.item
    }
    expect(days).toEqual(['2026-11-14', '2026-11-21', '2026-12-05'])
  })
  it('復習の途中で間違えたら翌日に戻す', () => {
    const item = { questionId: 'q1', dueDate: today, stage: 2, streak: 2, updatedAt: now }
    const r = nextReview(item, 'q1', false, today, now)
    expect(r.action === 'put' && r.item.stage).toBe(0)
    expect(r.action === 'put' && r.item.dueDate).toBe('2026-11-12')
  })
  it('復習日より前の正解では予定を変えない', () => {
    const item = { questionId: 'q1', dueDate: '2026-11-20', stage: 1, streak: 1, updatedAt: now }
    expect(nextReview(item, 'q1', true, today, now)).toEqual({ action: 'none' })
  })
  it('期限が来た問題だけを古い順に返す', () => {
    const items = [
      { questionId: 'a', dueDate: '2026-11-12', stage: 0, streak: 0, updatedAt: now },
      { questionId: 'b', dueDate: '2026-11-11', stage: 0, streak: 0, updatedAt: now },
      { questionId: 'c', dueDate: '2026-11-01', stage: 0, streak: 0, updatedAt: now },
    ]
    expect(dueItems(items, today).map((i) => i.questionId)).toEqual(['c', 'b'])
  })
})

describe('集計', () => {
  it('学習時間を日別に合計する', () => {
    const s = summarizeStudyTime(
      [
        { id: '1', date: '2026-11-11', feature: 'learn', seconds: 600, updatedAt: now },
        { id: '2', date: '2026-11-11', feature: 'practice', seconds: 300, updatedAt: now },
        { id: '3', date: '2026-11-09', feature: 'learn', seconds: 120, updatedAt: now },
        { id: '4', date: '2026-10-01', feature: 'learn', seconds: 30, updatedAt: now },
      ],
      '2026-11-11',
    )
    expect(s.todaySeconds).toBe(900)
    expect(s.totalSeconds).toBe(1050)
    expect(s.week).toHaveLength(7)
    expect(s.week[6]).toEqual({ date: '2026-11-11', seconds: 900 })
    expect(s.week[4]).toEqual({ date: '2026-11-09', seconds: 120 })
    expect(s.activeDays).toBe(2)
  })
  it('解答がないときの正答率は 0% ではなく「—」', () => {
    expect(accuracy([]).rate).toBeNull()
    expect(formatRate(null)).toBe('—')
    expect(formatRate(2 / 3)).toBe('67%')
  })
})
