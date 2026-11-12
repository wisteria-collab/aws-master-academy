import { describe, expect, it } from 'vitest'
import { isValidDate, makePlan } from './plan'
import { normalize, search, type SearchDoc } from './search'

describe('学習計画', () => {
  it('試験日までの日数と、1週間あたりのレッスン数を出す', () => {
    const p = makePlan('2026-11-12', '2026-12-24', 21, 9)
    expect(p.daysLeft).toBe(42)
    expect(p.reviewDays).toBe(14)
    expect(p.lessonDays).toBe(28)
    expect(p.remainingLessons).toBe(12)
    expect(p.lessonsPerWeek).toBe(3)
    expect(p.state).toBe('ok')
  })
  it('月をまたいでも日数を正しく数える', () => {
    expect(makePlan('2026-12-31', '2027-01-01', 5, 0).daysLeft).toBe(1)
    expect(makePlan('2028-02-28', '2028-03-01', 5, 0).daysLeft).toBe(2)
  })
  it('過ぎた日・当日・学習済み・間に合いにくい場合を区別する', () => {
    expect(makePlan('2026-11-12', '2026-11-01', 21, 0).state).toBe('past')
    expect(makePlan('2026-11-12', '2026-11-12', 21, 0).state).toBe('today')
    expect(makePlan('2026-11-12', '2026-12-24', 21, 21).state).toBe('done')
    const tight = makePlan('2026-11-12', '2026-11-19', 21, 0)
    expect(tight.state).toBe('tight')
    expect(tight.lessonsPerWeek).toBeLessThanOrEqual(21)
  })
  it('日付の形式を確かめる', () => {
    expect(isValidDate('2026-12-24')).toBe(true)
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('12/24')).toBe(false)
  })
})

describe('検索', () => {
  const docs: SearchDoc[] = [
    { kind: 'service', id: 's3', title: 'Amazon S3', note: 'オブジェクトストレージ', body: 'バケット' },
    { kind: 'service', id: 'ebs', title: 'Amazon EBS', note: 'ブロックストレージ', body: 'S3にスナップショットを保存' },
    { kind: 'term', id: 'az', title: 'アベイラビリティゾーン', note: 'データセンターのまとまり', body: '' },
  ]
  it('全角・半角と大文字・小文字をそろえる', () => {
    expect(normalize('Ｓ３　 バケット')).toBe('s3 バケット')
  })
  it('タイトルに含むものを上に並べる', () => {
    expect(search(docs, 's3').map((h) => h.id)).toEqual(['s3', 'ebs'])
  })
  it('複数の語は、すべて含むものだけ', () => {
    expect(search(docs, 'amazon ブロック').map((h) => h.id)).toEqual(['ebs'])
    expect(search(docs, 'ｓ３ バケット').map((h) => h.id)).toEqual(['s3'])
  })
  it('空の入力や、見つからない語は0件', () => {
    expect(search(docs, '  ')).toEqual([])
    expect(search(docs, 'lambda')).toEqual([])
  })
})
