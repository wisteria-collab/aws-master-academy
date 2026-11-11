/**
 * 端末に保存する学習データの形式。
 * バックアップの読み込み時にも同じ定義で検証する。
 * 形式を変えるときは SCHEMA_VERSION を上げ、backup.ts に移行処理を追加する。
 */
import { z } from 'zod'

export const SCHEMA_VERSION = 1

const iso = z.string().min(1)
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const exam = z.enum(['clf', 'saa'])

export const lessonProgressSchema = z.object({
  lessonId: z.string().min(1),
  status: z.enum(['in_progress', 'completed']),
  completedAt: iso.optional(),
  updatedAt: iso,
})

export const serviceProgressSchema = z.object({
  serviceId: z.string().min(1),
  learned: z.boolean(),
  lastViewedAt: iso.optional(),
  updatedAt: iso,
})

/** 1問への1回の解答 */
export const attemptSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
  exam,
  selected: z.array(z.string()),
  correct: z.boolean(),
  elapsedMs: z.number().nonnegative(),
  mode: z.enum(['lesson', 'domain', 'service', 'weak', 'random', 'mock', 'review', 'training']),
  sessionId: z.string().min(1),
  answeredAt: iso,
})

/** 間違えた問題の復習予定 */
export const reviewItemSchema = z.object({
  questionId: z.string().min(1),
  dueDate: date,
  stage: z.number().int().nonnegative(),
  streak: z.number().int().nonnegative(),
  updatedAt: iso,
})

export const examAttemptSchema = z.object({
  id: z.string().min(1),
  exam,
  questionIds: z.array(z.string()),
  answers: z.record(z.string(), z.array(z.string())),
  flagged: z.array(z.string()),
  startedAt: iso,
  finishedAt: iso.optional(),
  remainingSeconds: z.number().nonnegative(),
  status: z.enum(['in_progress', 'finished']),
  updatedAt: iso,
})

/** 学習時間。1日×機能ごとに1件 */
export const studySessionSchema = z.object({
  id: z.string().min(1),
  date,
  feature: z.string().min(1),
  seconds: z.number().nonnegative(),
  updatedAt: iso,
})

export const savedDiagramSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
  challengeId: z.string().optional(),
  updatedAt: iso,
})

export const favoriteSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['service', 'question', 'lesson', 'comparison']),
  refId: z.string().min(1),
  updatedAt: iso,
})

export const storeSchemas = {
  lessonProgress: lessonProgressSchema,
  serviceProgress: serviceProgressSchema,
  attempts: attemptSchema,
  reviewItems: reviewItemSchema,
  examAttempts: examAttemptSchema,
  studySessions: studySessionSchema,
  diagrams: savedDiagramSchema,
  favorites: favoriteSchema,
} as const

export type StoreName = keyof typeof storeSchemas
export const storeNames = Object.keys(storeSchemas) as StoreName[]

export type StoreMap = { [S in StoreName]: z.infer<(typeof storeSchemas)[S]> }
export type LessonProgress = StoreMap['lessonProgress']
export type ServiceProgress = StoreMap['serviceProgress']
export type Attempt = StoreMap['attempts']
export type ReviewItem = StoreMap['reviewItems']
export type ExamAttempt = StoreMap['examAttempts']
export type StudySession = StoreMap['studySessions']
export type SavedDiagram = StoreMap['diagrams']
export type Favorite = StoreMap['favorites']

/** 各ストアの主キーになる項目 */
export const storeKeys: { [S in StoreName]: keyof StoreMap[S] & string } = {
  lessonProgress: 'lessonId',
  serviceProgress: 'serviceId',
  attempts: 'id',
  reviewItems: 'questionId',
  examAttempts: 'id',
  studySessions: 'id',
  diagrams: 'id',
  favorites: 'id',
}

/** 画面での表示名 */
export const storeLabels: Record<StoreName, string> = {
  lessonProgress: 'レッスンの進捗',
  serviceProgress: 'サービスの学習状態',
  attempts: '問題の解答履歴',
  reviewItems: '復習の予定',
  examAttempts: '模擬試験の結果',
  studySessions: '学習時間の記録',
  diagrams: '保存した構成図',
  favorites: 'お気に入り',
}

export type StoreDump = { [S in StoreName]: StoreMap[S][] }

export function emptyDump(): StoreDump {
  return Object.fromEntries(storeNames.map((s) => [s, []])) as unknown as StoreDump
}

export function keyOf<S extends StoreName>(store: S, value: StoreMap[S]): string {
  return String(value[storeKeys[store]])
}
