/**
 * 教材データの形式（スキーマ）。
 * 教材は content/ 配下の JSON に置き、アプリ本体のコードとは分離する。
 * ここを変更したら scripts/validate-content.ts で全教材を検証すること。
 */
import { z } from 'zod'

const idPattern = /^[a-z0-9][a-z0-9-]*$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/

export const idSchema = z.string().regex(idPattern, 'IDは半角英小文字・数字・ハイフンのみ')
export const examIdSchema = z.enum(['clf', 'saa'])
export type ExamId = z.infer<typeof examIdSchema>

/** すべての教材に共通の管理項目 */
const metaShape = {
  id: idSchema,
  /** verified の教材だけが画面に表示される */
  status: z.enum(['draft', 'verified']),
  /** 出典。AWS公式を優先する */
  sources: z.array(z.object({ title: z.string().min(1), url: z.url() })),
  /** 最終確認日 YYYY-MM-DD */
  verifiedAt: z.string().regex(datePattern).optional(),
  /** 料金・上限値など変わりやすい情報を含む */
  volatile: z.boolean().optional(),
  /** 不確かな点がある場合の明記 */
  uncertainNote: z.string().min(1).optional(),
  /** 作成時に基準とした公式試験ガイドのバージョン（例：clf の 1.3） */
  basedOnGuide: z.array(z.object({ exam: examIdSchema, version: z.string().min(1) })).optional(),
}

type MetaLike = { status: 'draft' | 'verified'; sources: unknown[]; verifiedAt?: string }

/** verified にするには、出典1件以上と確認日が必須 */
function checkMeta(value: MetaLike, ctx: z.RefinementCtx) {
  if (value.status !== 'verified') return
  if (value.sources.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['sources'], message: 'verified の教材には出典が1件以上必要' })
  }
  if (!value.verifiedAt) {
    ctx.addIssue({ code: 'custom', path: ['verifiedAt'], message: 'verified の教材には確認日が必要' })
  }
}

const nonEmpty = z.string().min(1)
const importanceSchema = z.enum(['high', 'mid', 'low', 'out'])

/* ---------- 試験仕様 ---------- */
export const examSpecSchema = z
  .object({
    ...metaShape,
    exam: examIdSchema,
    code: nonEmpty,
    name: nonEmpty,
    nameJa: nonEmpty,
    /** 公式試験ガイドのバージョンと発行日。ガイドが改訂されたらここを更新し、教材を再照合する */
    guideVersion: nonEmpty,
    guideDate: z.string().regex(datePattern),
    questionCount: z.number().int().positive(),
    scoredCount: z.number().int().positive(),
    unscoredCount: z.number().int().nonnegative(),
    durationMinutes: z.number().int().positive(),
    passingScore: z.number().int().positive(),
    scoreMin: z.number().int(),
    scoreMax: z.number().int(),
    questionTypes: z.array(nonEmpty).min(1),
    domains: z
      .array(
        z.object({
          id: idSchema,
          title: nonEmpty,
          weight: z.number().positive(),
          tasks: z.array(z.object({ id: idSchema, title: nonEmpty })).min(1),
        }),
      )
      .min(1),
    notes: z.array(nonEmpty).default([]),
  })
  .superRefine((v, ctx) => {
    checkMeta(v, ctx)
    const sum = v.domains.reduce((s, d) => s + d.weight, 0)
    if (sum !== 100) ctx.addIssue({ code: 'custom', path: ['domains'], message: `分野の比率の合計が100ではない（${sum}）` })
    if (v.scoredCount + v.unscoredCount !== v.questionCount) {
      ctx.addIssue({ code: 'custom', path: ['questionCount'], message: '採点対象＋採点対象外が問題数と一致しない' })
    }
  })
export type ExamSpec = z.infer<typeof examSpecSchema>

/* ---------- レッスン（講義） ---------- */
export const lessonSchema = z
  .object({
    ...metaShape,
    course: examIdSchema,
    order: z.number().int().nonnegative(),
    title: nonEmpty,
    domainId: idSchema,
    taskIds: z.array(idSchema).default([]),
    /** 7ブロック構成。表示順は固定 */
    overview: nonEmpty,
    beginner: z.object({ analogy: nonEmpty, description: nonEmpty }),
    useCases: z.array(nonEmpty).min(1),
    mechanism: z.object({ text: nonEmpty, figureId: idSchema.optional() }),
    relatedServiceIds: z.array(idSchema).default([]),
    examPoints: z.array(nonEmpty).min(1),
    quizQuestionIds: z.array(idSchema).min(1),
    glossaryTermIds: z.array(idSchema).default([]),
  })
  .superRefine(checkMeta)
export type Lesson = z.infer<typeof lessonSchema>

/* ---------- サービス図鑑 ---------- */
export const serviceSchema = z
  .object({
    ...metaShape,
    name: nonEmpty,
    aliases: z.array(nonEmpty).default([]),
    category: idSchema,
    summary: nonEmpty,
    beginner: z.object({ analogy: nonEmpty, description: nonEmpty }),
    exam: z.object({ description: nonEmpty, points: z.array(nonEmpty).min(1) }),
    useCases: z.array(nonEmpty).min(1),
    mechanism: nonEmpty,
    pros: z.array(nonEmpty).min(1),
    cons: z.array(nonEmpty).min(1),
    scenes: z.array(nonEmpty).min(1),
    similarServiceIds: z.array(idSchema).default([]),
    relatedServiceIds: z.array(idSchema).default([]),
    comparisonGroupIds: z.array(idSchema).default([]),
    importance: z.object({ clf: importanceSchema, saa: importanceSchema }),
    examDomains: z.array(z.object({ exam: examIdSchema, domainId: idSchema })).default([]),
    docUrl: z.url(),
  })
  .superRefine(checkMeta)
export type Service = z.infer<typeof serviceSchema>

/* ---------- 類似サービス比較 ---------- */
/** 比較の12項目（要件定義の比較画面の仕様に対応） */
export const comparisonAxes = [
  { key: 'role', label: '基本的な役割' },
  { key: 'mechanism', label: '仕組み' },
  { key: 'data', label: 'データの扱い方' },
  { key: 'useCases', label: '主な利用用途' },
  { key: 'availability', label: '可用性' },
  { key: 'performance', label: 'パフォーマンス' },
  { key: 'scalability', label: '拡張性' },
  { key: 'cost', label: 'コストの考え方' },
  { key: 'operations', label: '運用負荷' },
  { key: 'limits', label: '制約' },
  { key: 'chooseWhen', label: '選択すべき場面' },
  { key: 'avoidWhen', label: '選択してはいけない場面' },
] as const
export type ComparisonAxisKey = (typeof comparisonAxes)[number]['key']

const axisValuesShape = Object.fromEntries(comparisonAxes.map((a) => [a.key, nonEmpty])) as Record<
  ComparisonAxisKey,
  typeof nonEmpty
>

export const comparisonGroupSchema = z
  .object({
    ...metaShape,
    title: nonEmpty,
    category: idSchema,
    summary: nonEmpty,
    /** 比較対象。Multi-AZ のようにサービスではないものも扱えるよう serviceId は任意 */
    items: z
      .array(
        z.object({
          key: idSchema,
          label: nonEmpty,
          serviceId: idSchema.optional(),
          oneLine: nonEmpty,
          values: z.object(axisValuesShape),
        }),
      )
      .min(2),
    figureIds: z.array(idSchema).default([]),
    /** 質問をたどって適切なサービスに着く判断フロー */
    decisionFlow: z
      .array(
        z.object({
          id: idSchema,
          question: nonEmpty.optional(),
          yes: idSchema.optional(),
          no: idSchema.optional(),
          resultItemKey: idSchema.optional(),
          note: nonEmpty.optional(),
        }),
      )
      .default([]),
    trainingQuestionIds: z.array(idSchema).default([]),
  })
  .superRefine((v, ctx) => {
    checkMeta(v, ctx)
    const keys = new Set(v.items.map((i) => i.key))
    const nodeIds = new Set(v.decisionFlow.map((n) => n.id))
    v.decisionFlow.forEach((n, i) => {
      const isQuestion = n.question !== undefined
      if (isQuestion && (!n.yes || !n.no)) {
        ctx.addIssue({ code: 'custom', path: ['decisionFlow', i], message: '質問ノードには yes と no の行き先が必要' })
      }
      if (!isQuestion && !n.resultItemKey) {
        ctx.addIssue({ code: 'custom', path: ['decisionFlow', i], message: '結果ノードには resultItemKey が必要' })
      }
      for (const next of [n.yes, n.no]) {
        if (next && !nodeIds.has(next)) {
          ctx.addIssue({ code: 'custom', path: ['decisionFlow', i], message: `行き先 ${next} が存在しない` })
        }
      }
      if (n.resultItemKey && !keys.has(n.resultItemKey)) {
        ctx.addIssue({ code: 'custom', path: ['decisionFlow', i], message: `比較対象 ${n.resultItemKey} が存在しない` })
      }
    })
  })
export type ComparisonGroup = z.infer<typeof comparisonGroupSchema>

/* ---------- 問題 ---------- */
export const questionSchema = z
  .object({
    ...metaShape,
    exam: examIdSchema,
    domainId: idSchema,
    taskId: idSchema.optional(),
    /** 出題の種類 */
    format: z.enum(['basic', 'scenario', 'comparison', 'architecture']),
    /** 択一か複数選択か */
    select: z.enum(['single', 'multiple']),
    difficulty: z.enum(['basic', 'standard', 'advanced']),
    stem: nonEmpty,
    choices: z
      .array(
        z.object({
          id: idSchema,
          text: nonEmpty,
          correct: z.boolean(),
          /** 正解ならその理由、不正解なら「なぜ不適切か」。全選択肢で必須 */
          explanation: z.string().min(10, '選択肢ごとの解説は必須（10文字以上）'),
          /** 不正解の選択肢を排除する問題文中の条件 */
          eliminatedBy: nonEmpty.optional(),
        }),
      )
      .min(4),
    /** 問題文の中で判断材料になる語句（問題文に含まれていること） */
    keywords: z.array(nonEmpty).min(1),
    decisionPoint: nonEmpty,
    practicalNote: nonEmpty.optional(),
    serviceIds: z.array(idSchema).default([]),
    related: z
      .array(z.object({ type: z.enum(['lesson', 'service', 'comparison']), id: idSchema }))
      .default([]),
    /** 条件を変えた応用問題の組 */
    variationGroupId: idSchema.optional(),
  })
  .superRefine((v, ctx) => {
    checkMeta(v, ctx)
    const correct = v.choices.filter((c) => c.correct).length
    if (v.select === 'single' && correct !== 1) {
      ctx.addIssue({ code: 'custom', path: ['choices'], message: `択一問題の正解は1つ（現在${correct}）` })
    }
    if (v.select === 'multiple') {
      if (correct < 2) ctx.addIssue({ code: 'custom', path: ['choices'], message: '複数選択問題の正解は2つ以上' })
      if (v.choices.length < 5) ctx.addIssue({ code: 'custom', path: ['choices'], message: '複数選択問題の選択肢は5つ以上' })
      if (correct >= v.choices.length) ctx.addIssue({ code: 'custom', path: ['choices'], message: '不正解の選択肢が必要' })
    }
    const ids = v.choices.map((c) => c.id)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['choices'], message: '選択肢IDが重複している' })
    }
    v.keywords.forEach((k, i) => {
      if (!v.stem.includes(k)) {
        ctx.addIssue({ code: 'custom', path: ['keywords', i], message: `キーワード「${k}」が問題文に含まれていない` })
      }
    })
    v.choices.forEach((c, i) => {
      if (v.status === 'verified' && !c.correct && !c.eliminatedBy) {
        ctx.addIssue({
          code: 'custom',
          path: ['choices', i, 'eliminatedBy'],
          message: '不正解の選択肢には、排除の根拠になる条件（eliminatedBy）が必要',
        })
      }
    })
  })
export type Question = z.infer<typeof questionSchema>

/* ---------- 構成図（お手本・設計問題） ---------- */
const diagramNodeSchema = z.object({
  id: idSchema,
  kind: z.enum(['service', 'group', 'actor']),
  serviceId: idSchema.optional(),
  label: nonEmpty,
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  parentId: idSchema.optional(),
})
const diagramEdgeSchema = z.object({ id: idSchema, from: idSchema, to: idSchema, label: nonEmpty.optional() })
const diagramBodySchema = z.object({ nodes: z.array(diagramNodeSchema), edges: z.array(diagramEdgeSchema) })

export const diagramTemplateSchema = z
  .object({
    ...metaShape,
    title: nonEmpty,
    order: z.number().int().nonnegative(),
    summary: nonEmpty,
    diagram: diagramBodySchema,
    explanation: nonEmpty,
    points: z.array(nonEmpty).min(1),
  })
  .superRefine(checkMeta)
export type DiagramTemplate = z.infer<typeof diagramTemplateSchema>

export const designChallengeSchema = z
  .object({
    ...metaShape,
    title: nonEmpty,
    scenario: nonEmpty,
    requirements: z.array(nonEmpty).min(1),
    modelAnswer: diagramBodySchema,
    modelExplanation: nonEmpty,
    /** 観点別チェックリスト。判定ルールの種類は Phase 5 で確定する */
    checklist: z
      .array(z.object({ id: idSchema, label: nonEmpty, rule: z.looseObject({ type: nonEmpty }), reason: nonEmpty }))
      .min(1),
  })
  .superRefine(checkMeta)
export type DesignChallenge = z.infer<typeof designChallengeSchema>

/* ---------- 用語集 ---------- */
export const glossaryTermSchema = z
  .object({
    ...metaShape,
    term: nonEmpty,
    reading: nonEmpty.optional(),
    description: nonEmpty,
    serviceIds: z.array(idSchema).default([]),
  })
  .superRefine(checkMeta)
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>

/** content/ 直下のフォルダ名と、その中身の形式の対応 */
export const contentKinds = {
  exams: examSpecSchema,
  lessons: lessonSchema,
  services: serviceSchema,
  comparisons: comparisonGroupSchema,
  questions: questionSchema,
  diagrams: diagramTemplateSchema,
  challenges: designChallengeSchema,
  glossary: glossaryTermSchema,
} as const
export type ContentKind = keyof typeof contentKinds

export interface ContentBundle {
  exams: ExamSpec[]
  lessons: Lesson[]
  services: Service[]
  comparisons: ComparisonGroup[]
  questions: Question[]
  diagrams: DiagramTemplate[]
  challenges: DesignChallenge[]
  glossary: GlossaryTerm[]
}

export function emptyBundle(): ContentBundle {
  return {
    exams: [],
    lessons: [],
    services: [],
    comparisons: [],
    questions: [],
    diagrams: [],
    challenges: [],
    glossary: [],
  }
}
