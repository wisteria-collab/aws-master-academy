/**
 * 教材データの検証。アプリの読み込み時と、検証スクリプトの両方から使う。
 * - 形式が正しいか
 * - IDが重複していないか
 * - 参照先（関連サービス、問題など）が存在し、公開済みか
 * - 確認日が古くなっていないか（警告）
 */
import { contentKinds, emptyBundle, type ContentBundle, type ContentKind } from './schema'

export interface ContentIssue {
  level: 'error' | 'warning'
  file: string
  id?: string
  message: string
}

export interface ValidationResult {
  /** 画面に出してよい教材（verified かつ問題なし） */
  bundle: ContentBundle
  issues: ContentIssue[]
  counts: Record<ContentKind, { verified: number; draft: number }>
}

/** 確認日からこの日数を超えたら「要再確認」とする */
export const STALE_DAYS = 180

interface Entry {
  kind: ContentKind
  file: string
  value: { id: string; status: 'draft' | 'verified'; verifiedAt?: string } & Record<string, unknown>
}

function kindOf(path: string): ContentKind | undefined {
  const m = path.replace(/\\/g, '/').match(/content\/([a-z]+)\//)
  const k = m?.[1]
  return k && k in contentKinds ? (k as ContentKind) : undefined
}

export function daysBetween(fromDate: string, toDate: string): number {
  const a = Date.parse(`${fromDate}T00:00:00Z`)
  const b = Date.parse(`${toDate}T00:00:00Z`)
  return Math.floor((b - a) / 86_400_000)
}

/**
 * @param files パス → JSONの中身（1件のオブジェクト、または配列）
 * @param today YYYY-MM-DD
 */
export function validateContent(files: Record<string, unknown>, today: string): ValidationResult {
  const issues: ContentIssue[] = []
  const entries: Entry[] = []

  for (const [file, raw] of Object.entries(files)) {
    const kind = kindOf(file)
    if (!kind) {
      issues.push({ level: 'error', file, message: '置き場所が不明（content/<種類>/ の下に置く）' })
      continue
    }
    const list = Array.isArray(raw) ? raw : [raw]
    list.forEach((item, index) => {
      const parsed = contentKinds[kind].safeParse(item)
      if (!parsed.success) {
        const id = typeof (item as { id?: unknown })?.id === 'string' ? (item as { id: string }).id : `#${index}`
        for (const issue of parsed.error.issues) {
          issues.push({ level: 'error', file, id, message: `${issue.path.join('.') || '(全体)'}: ${issue.message}` })
        }
        return
      }
      entries.push({ kind, file, value: parsed.data as Entry['value'] })
    })
  }

  // ID の重複（同じ種類の中で）
  const seen = new Map<string, string>()
  const duplicated = new Set<string>()
  for (const e of entries) {
    const key = `${e.kind}:${e.value.id}`
    const prev = seen.get(key)
    if (prev) {
      duplicated.add(key)
      issues.push({ level: 'error', file: e.file, id: e.value.id, message: `IDが重複している（${prev} と同じ）` })
    } else {
      seen.set(key, e.file)
    }
  }

  const status = new Map<string, 'draft' | 'verified'>()
  for (const e of entries) status.set(`${e.kind}:${e.value.id}`, e.value.status)

  const broken = new Set<string>()
  const ref = (e: Entry, kind: ContentKind, id: string | undefined, label: string) => {
    if (!id) return
    const s = status.get(`${kind}:${id}`)
    const self = `${e.kind}:${e.value.id}`
    if (!s) {
      issues.push({ level: 'error', file: e.file, id: e.value.id, message: `${label}の参照先 ${kind}/${id} が存在しない` })
      broken.add(self)
    } else if (s === 'draft' && e.value.status === 'verified') {
      issues.push({
        level: 'error',
        file: e.file,
        id: e.value.id,
        message: `${label}の参照先 ${kind}/${id} が未検証（draft）。公開する教材から参照できない`,
      })
      broken.add(self)
    }
  }

  const examDomains = new Map<string, Set<string>>()
  const examTasks = new Map<string, Set<string>>()
  const guideVersions = new Map<string, string>()
  for (const e of entries) {
    if (e.kind !== 'exams') continue
    const spec = e.value as unknown as ContentBundle['exams'][number]
    guideVersions.set(spec.exam, spec.guideVersion)
    examDomains.set(spec.exam, new Set(spec.domains.map((d) => d.id)))
    examTasks.set(spec.exam, new Set(spec.domains.flatMap((d) => d.tasks.map((t) => t.id))))
  }
  const domainRef = (e: Entry, exam: string, domainId: string, taskIds: (string | undefined)[]) => {
    const self = `${e.kind}:${e.value.id}`
    if (!examDomains.get(exam)?.has(domainId)) {
      issues.push({ level: 'error', file: e.file, id: e.value.id, message: `試験 ${exam} に分野 ${domainId} が存在しない` })
      broken.add(self)
    }
    for (const t of taskIds) {
      if (t && !examTasks.get(exam)?.has(t)) {
        issues.push({ level: 'error', file: e.file, id: e.value.id, message: `試験 ${exam} にタスク ${t} が存在しない` })
        broken.add(self)
      }
    }
  }

  /** 試験範囲に基づく教材は、基準にした公式ガイドのバージョンを記録する */
  const guideRef = (e: Entry, exam: string) => {
    if (e.value.status !== 'verified') return
    const based = (e.value.basedOnGuide as { exam: string; version: string }[] | undefined)?.find((g) => g.exam === exam)
    const current = guideVersions.get(exam)
    if (!based) {
      issues.push({ level: 'error', file: e.file, id: e.value.id, message: `基準にした公式ガイドのバージョン（basedOnGuide: ${exam}）が未記入` })
      broken.add(`${e.kind}:${e.value.id}`)
    } else if (current && based.version !== current) {
      issues.push({
        level: 'warning',
        file: e.file,
        id: e.value.id,
        message: `公式ガイド ${exam} の Version ${based.version} を基準にしている（現在は ${current}）。最新版と再照合する`,
      })
    }
  }

  for (const e of entries) {
    switch (e.kind) {
      case 'lessons': {
        const v = e.value as unknown as ContentBundle['lessons'][number]
        domainRef(e, v.course, v.domainId, v.taskIds)
        guideRef(e, v.course)
        v.relatedServiceIds.forEach((id) => ref(e, 'services', id, '関連サービス'))
        v.quizQuestionIds.forEach((id) => ref(e, 'questions', id, '確認問題'))
        v.glossaryTermIds.forEach((id) => ref(e, 'glossary', id, '用語'))
        break
      }
      case 'services': {
        const v = e.value as unknown as ContentBundle['services'][number]
        v.similarServiceIds.forEach((id) => ref(e, 'services', id, '類似サービス'))
        v.relatedServiceIds.forEach((id) => ref(e, 'services', id, '関連サービス'))
        v.comparisonGroupIds.forEach((id) => ref(e, 'comparisons', id, '比較グループ'))
        v.examDomains.forEach((d) => domainRef(e, d.exam, d.domainId, []))
        break
      }
      case 'comparisons': {
        const v = e.value as unknown as ContentBundle['comparisons'][number]
        v.items.forEach((i) => ref(e, 'services', i.serviceId, '比較対象'))
        v.trainingQuestionIds.forEach((id) => ref(e, 'questions', id, 'トレーニング問題'))
        break
      }
      case 'questions': {
        const v = e.value as unknown as ContentBundle['questions'][number]
        domainRef(e, v.exam, v.domainId, [v.taskId])
        guideRef(e, v.exam)
        v.serviceIds.forEach((id) => ref(e, 'services', id, '関連サービス'))
        v.related.forEach((r) =>
          ref(e, r.type === 'lesson' ? 'lessons' : r.type === 'service' ? 'services' : 'comparisons', r.id, '関連教材'),
        )
        break
      }
      case 'diagrams': {
        const v = e.value as unknown as ContentBundle['diagrams'][number]
        v.diagram.nodes.forEach((n) => ref(e, 'services', n.serviceId, '構成図のサービス'))
        break
      }
      case 'challenges': {
        const v = e.value as unknown as ContentBundle['challenges'][number]
        v.modelAnswer.nodes.forEach((n) => ref(e, 'services', n.serviceId, '模範解答のサービス'))
        break
      }
      case 'glossary': {
        const v = e.value as unknown as ContentBundle['glossary'][number]
        v.serviceIds.forEach((id) => ref(e, 'services', id, '関連サービス'))
        break
      }
      case 'exams':
        break
    }
  }

  const bundle = emptyBundle()
  const counts = Object.fromEntries(
    (Object.keys(contentKinds) as ContentKind[]).map((k) => [k, { verified: 0, draft: 0 }]),
  ) as ValidationResult['counts']

  for (const e of entries) {
    const key = `${e.kind}:${e.value.id}`
    if (e.value.status === 'draft') {
      counts[e.kind].draft += 1
      continue
    }
    if (duplicated.has(key) || broken.has(key)) continue
    counts[e.kind].verified += 1
    ;(bundle[e.kind] as unknown[]).push(e.value)
    if (e.value.verifiedAt && daysBetween(e.value.verifiedAt, today) > STALE_DAYS) {
      issues.push({
        level: 'warning',
        file: e.file,
        id: e.value.id,
        message: `確認日（${e.value.verifiedAt}）から${STALE_DAYS}日を超えている。公式情報と再照合する`,
      })
    }
  }

  return { bundle, issues, counts }
}
