import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { addStudySeconds } from '../logic/studyTimer'
import { createBackup, importBackup, mergeDumps, parseBackup } from './backup'
import { DexieAdapter } from './dexieAdapter'
import { emptyDump, type Attempt } from './records'

const now = '2026-11-11T01:00:00.000Z'
const attempt = (id: string, correct = true): Attempt => ({
  id,
  questionId: 'q1',
  exam: 'clf',
  selected: ['a'],
  correct,
  elapsedMs: 1000,
  mode: 'domain',
  sessionId: 's1',
  answeredAt: now,
})

let seq = 0
let db: DexieAdapter
beforeEach(() => {
  db = new DexieAdapter(`test-${seq++}`)
})

describe('保存層（IndexedDB）', () => {
  it('保存したデータは、接続を閉じて開き直しても残っている', async () => {
    const name = `persist-${seq++}`
    const a = new DexieAdapter(name)
    await a.put('lessonProgress', { lessonId: 'l1', status: 'completed', completedAt: now, updatedAt: now })
    await a.put('attempts', attempt('a1'))
    a.close()

    const b = new DexieAdapter(name)
    expect(await b.get('lessonProgress', 'l1')).toMatchObject({ status: 'completed' })
    expect(await b.getAll('attempts')).toHaveLength(1)
    b.close()
  })

  it('変更があると購読者に通知する', async () => {
    const seen: string[] = []
    const off = db.subscribe((s) => seen.push(s))
    await db.put('favorites', { id: 'service:s3', type: 'service', refId: 's3', updatedAt: now })
    await db.remove('favorites', 'service:s3')
    off()
    await db.put('favorites', { id: 'service:s3', type: 'service', refId: 's3', updatedAt: now })
    expect(seen).toEqual(['favorites', 'favorites'])
  })

  it('学習時間は同じ日・同じ機能の記録に加算される', async () => {
    const t = new Date(2026, 10, 11, 10, 0)
    await addStudySeconds(db, 'learn', 15, t)
    await addStudySeconds(db, 'learn', 15, t)
    await addStudySeconds(db, 'practice', 10, t)
    const all = await db.getAll('studySessions')
    expect(all).toHaveLength(2)
    expect(all.find((s) => s.feature === 'learn')?.seconds).toBe(30)
  })

  it('全削除ですべてのストアが空になる', async () => {
    await db.put('attempts', attempt('a1'))
    await db.clearAll()
    expect((await db.dump()).attempts).toEqual([])
  })
})

describe('バックアップ', () => {
  it('書き出したものを別の端末（空のDB）に読み込むと同じ内容になる', async () => {
    await db.put('attempts', attempt('a1'))
    await db.put('reviewItems', { questionId: 'q1', dueDate: '2026-11-12', stage: 0, streak: 0, updatedAt: now })
    const text = JSON.stringify(await createBackup(db))

    const other = new DexieAdapter(`other-${seq++}`)
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.counts.attempts).toBe(1)
    await importBackup(other, parsed.backup, 'replace')
    expect(await other.dump()).toEqual(await db.dump())
  })

  it('上書きは今のデータを消し、統合は両方を残す', async () => {
    await db.put('attempts', attempt('local'))
    const incoming = emptyDump()
    incoming.attempts = [attempt('remote')]
    const backup = { app: 'aws-master-academy' as const, schemaVersion: 1, exportedAt: now, stores: incoming }

    await importBackup(db, backup, 'merge')
    expect((await db.getAll('attempts')).map((a) => a.id).sort()).toEqual(['local', 'remote'])

    await importBackup(db, backup, 'replace')
    expect((await db.getAll('attempts')).map((a) => a.id)).toEqual(['remote'])
  })

  it('統合では更新が新しいほうを残し、学習時間は二重に足さない', () => {
    const a = emptyDump()
    const b = emptyDump()
    a.lessonProgress = [{ lessonId: 'l1', status: 'in_progress', updatedAt: '2026-11-01T00:00:00.000Z' }]
    b.lessonProgress = [{ lessonId: 'l1', status: 'completed', updatedAt: '2026-11-05T00:00:00.000Z' }]
    a.studySessions = [{ id: 'd:learn', date: '2026-11-01', feature: 'learn', seconds: 600, updatedAt: now }]
    b.studySessions = [{ id: 'd:learn', date: '2026-11-01', feature: 'learn', seconds: 400, updatedAt: now }]
    const m = mergeDumps(a, b)
    expect(m.lessonProgress[0].status).toBe('completed')
    expect(m.studySessions[0].seconds).toBe(600)
    // 逆向きに統合しても結果は同じ
    expect(mergeDumps(b, a).lessonProgress[0].status).toBe('completed')
  })

  it('壊れたファイルや別のファイルは拒否し、既存データを変えない', async () => {
    await db.put('attempts', attempt('a1'))
    expect(parseBackup('{ これはJSONではない').ok).toBe(false)
    expect(parseBackup('{"hello":"world"}').ok).toBe(false)
    const bad = JSON.stringify({
      app: 'aws-master-academy',
      schemaVersion: 1,
      exportedAt: now,
      stores: { attempts: [{ id: 'x' }] },
    })
    expect(parseBackup(bad).ok).toBe(false)
    const future = JSON.stringify({ app: 'aws-master-academy', schemaVersion: 99, exportedAt: now, stores: {} })
    expect(parseBackup(future).ok).toBe(false)
    expect(await db.getAll('attempts')).toHaveLength(1)
  })

  it('ストアが欠けたバックアップは空として読み込める', () => {
    const r = parseBackup(JSON.stringify({ app: 'aws-master-academy', schemaVersion: 1, exportedAt: now, stores: {} }))
    expect(r.ok).toBe(true)
  })
})
