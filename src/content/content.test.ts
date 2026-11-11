import { describe, expect, it } from 'vitest'
import clf from '../../content/exams/clf-c02.json'
import saa from '../../content/exams/saa-c03.json'
import { validateContent } from './validate'

const today = '2026-11-11'
const base = { 'content/exams/clf-c02.json': clf, 'content/exams/saa-c03.json': saa }

const question = (over: Record<string, unknown> = {}) => ({
  id: 'q-test-1',
  status: 'verified',
  sources: [{ title: 'AWS公式', url: 'https://docs.aws.amazon.com/' }],
  verifiedAt: today,
  basedOnGuide: [{ exam: 'clf', version: '1.3' }],
  exam: 'clf',
  domainId: 'clf-d3',
  taskId: 'clf-3-6',
  format: 'comparison',
  select: 'single',
  difficulty: 'standard',
  stem: '複数のEC2インスタンスから同じファイルシステムにアクセスする必要があります。',
  choices: [
    { id: 'a', text: 'A', correct: false, explanation: 'オブジェクトストレージのため不適切です。', eliminatedBy: 'ファイルシステム' },
    { id: 'b', text: 'B', correct: false, explanation: '基本的に1台に接続するため不適切です。', eliminatedBy: '複数のEC2インスタンス' },
    { id: 'c', text: 'C', correct: true, explanation: '複数台から同時に使える共有ファイルシステムです。' },
    { id: 'd', text: 'D', correct: false, explanation: 'データベースのため不適切です。', eliminatedBy: 'ファイルシステム' },
  ],
  keywords: ['複数のEC2インスタンス', '同じファイルシステム'],
  decisionPoint: '複数台からの同時アクセス',
  ...over,
})

describe('教材の検証', () => {
  it('試験仕様は公式の問題数・時間・比率と一致している', () => {
    const r = validateContent(base, today)
    expect(r.issues.filter((i) => i.level === 'error')).toEqual([])
    const c = r.bundle.exams.find((e) => e.exam === 'clf')!
    const s = r.bundle.exams.find((e) => e.exam === 'saa')!
    expect([c.questionCount, c.durationMinutes, c.passingScore]).toEqual([65, 90, 700])
    expect([s.questionCount, s.durationMinutes, s.passingScore]).toEqual([65, 130, 720])
    expect(c.domains.map((d) => d.weight)).toEqual([24, 30, 34, 12])
    expect(s.domains.map((d) => d.weight)).toEqual([30, 26, 24, 20])
    expect(s.domains.flatMap((d) => d.tasks)).toHaveLength(14)
    expect(c.domains.flatMap((d) => d.tasks)).toHaveLength(19)
    expect([c.guideVersion, c.guideDate]).toEqual(['1.3', '2026-10-29'])
    expect([s.guideVersion, s.guideDate]).toEqual(['1.1', '2026-10-29'])
  })

  it('基準にしたガイドのバージョンがない教材は公開されず、古い版には警告を出す', () => {
    const r = validateContent({ ...base, 'content/questions/t.json': [question({ basedOnGuide: undefined })] }, today)
    expect(r.bundle.questions).toHaveLength(0)
    expect(r.issues.some((i) => i.message.includes('basedOnGuide'))).toBe(true)
    const old = validateContent({ ...base, 'content/questions/t.json': [question({ basedOnGuide: [{ exam: 'clf', version: '1.2' }] })] }, today)
    expect(old.bundle.questions).toHaveLength(1)
    expect(old.issues.some((i) => i.level === 'warning' && i.message.includes('最新版と再照合'))).toBe(true)
  })

  it('正しい問題は公開される', () => {
    const r = validateContent({ ...base, 'content/questions/t.json': [question()] }, today)
    expect(r.issues).toEqual([])
    expect(r.bundle.questions).toHaveLength(1)
  })

  it('draft の教材は公開されない', () => {
    const r = validateContent({ ...base, 'content/questions/t.json': [question({ status: 'draft' })] }, today)
    expect(r.bundle.questions).toHaveLength(0)
    expect(r.counts.questions.draft).toBe(1)
  })

  it('出典や確認日のない教材は verified にできない', () => {
    const r = validateContent({ ...base, 'content/questions/t.json': [question({ sources: [], verifiedAt: undefined })] }, today)
    expect(r.bundle.questions).toHaveLength(0)
    expect(r.issues.some((i) => i.message.includes('出典'))).toBe(true)
    expect(r.issues.some((i) => i.message.includes('確認日'))).toBe(true)
  })

  it('択一問題で正解が2つあると弾く', () => {
    const q = question()
    const choices = (q.choices as { correct: boolean }[]).map((c, i) => ({ ...c, correct: i < 2 }))
    const r = validateContent({ ...base, 'content/questions/t.json': [question({ choices })] }, today)
    expect(r.bundle.questions).toHaveLength(0)
    expect(r.issues.some((i) => i.message.includes('正解は1つ'))).toBe(true)
  })

  it('不正解の選択肢に解説や排除の根拠がないと弾く', () => {
    const q = question()
    const choices = (q.choices as Record<string, unknown>[]).map((c) => ({ ...c, eliminatedBy: undefined }))
    const r = validateContent({ ...base, 'content/questions/t.json': [question({ choices })] }, today)
    expect(r.bundle.questions).toHaveLength(0)
    const short = (q.choices as Record<string, unknown>[]).map((c) => ({ ...c, explanation: '不適切' }))
    const r2 = validateContent({ ...base, 'content/questions/t.json': [question({ choices: short })] }, today)
    expect(r2.bundle.questions).toHaveLength(0)
  })

  it('問題文にないキーワードを弾く', () => {
    const r = validateContent({ ...base, 'content/questions/t.json': [question({ keywords: ['低コスト'] })] }, today)
    expect(r.bundle.questions).toHaveLength(0)
  })

  it('存在しない分野・サービスへの参照を弾く', () => {
    const r = validateContent({ ...base, 'content/questions/t.json': [question({ domainId: 'clf-d9' })] }, today)
    expect(r.bundle.questions).toHaveLength(0)
    const r2 = validateContent({ ...base, 'content/questions/t.json': [question({ serviceIds: ['no-such'] })] }, today)
    expect(r2.bundle.questions).toHaveLength(0)
    expect(r2.issues.some((i) => i.message.includes('存在しない'))).toBe(true)
  })

  it('IDの重複を弾く', () => {
    const r = validateContent({ ...base, 'content/questions/t.json': [question(), question()] }, today)
    expect(r.issues.some((i) => i.message.includes('重複'))).toBe(true)
    expect(r.bundle.questions).toHaveLength(0)
  })

  it('確認日が古い教材には警告を出す', () => {
    const r = validateContent({ ...base, 'content/questions/t.json': [question({ verifiedAt: '2026-01-01' })] }, today)
    expect(r.issues.some((i) => i.level === 'warning' && i.message.includes('再照合'))).toBe(true)
    expect(r.bundle.questions).toHaveLength(1)
  })
})
