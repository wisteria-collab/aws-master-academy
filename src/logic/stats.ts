/**
 * 集計。正答率や学習時間は保存せず、履歴からその都度計算する。
 */
import type { Attempt, StudySession } from '../storage/records'
import { lastDays } from './dates'

export interface StudyTimeSummary {
  todaySeconds: number
  totalSeconds: number
  /** 直近7日分（古い順） */
  week: { date: string; seconds: number }[]
  /** 学習した日数 */
  activeDays: number
}

export function summarizeStudyTime(sessions: StudySession[], today: string): StudyTimeSummary {
  const byDate = new Map<string, number>()
  for (const s of sessions) byDate.set(s.date, (byDate.get(s.date) ?? 0) + s.seconds)
  return {
    todaySeconds: byDate.get(today) ?? 0,
    totalSeconds: [...byDate.values()].reduce((a, b) => a + b, 0),
    week: lastDays(today, 7).map((date) => ({ date, seconds: byDate.get(date) ?? 0 })),
    activeDays: [...byDate.values()].filter((v) => v >= 60).length,
  }
}

export interface Accuracy {
  answered: number
  correct: number
  /** 0〜1。解答がなければ null（0%と区別する） */
  rate: number | null
}

export function accuracy(attempts: Attempt[]): Accuracy {
  const answered = attempts.length
  const correct = attempts.filter((a) => a.correct).length
  return { answered, correct, rate: answered === 0 ? null : correct / answered }
}

/** 割合の表示。データがないときは「—」 */
export function formatRate(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate * 100)}%`
}
