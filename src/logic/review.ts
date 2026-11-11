/**
 * 間違えた問題の復習スケジュール（間隔を広げながら再出題する）。
 * - 間違えたら翌日に再出題
 * - 復習で正解するたびに 3日後 → 7日後 → 14日後 と間隔を広げる
 * - 最後の段階で正解したら復習リストから外す
 * - 途中で間違えたら翌日に戻す
 */
import { learningConfig } from '../config/learning'
import type { ReviewItem } from '../storage/records'
import { addDays } from './dates'

export type ReviewUpdate = { action: 'put'; item: ReviewItem } | { action: 'remove' } | { action: 'none' }

export function nextReview(
  current: ReviewItem | undefined,
  questionId: string,
  correct: boolean,
  today: string,
  nowIso: string,
  intervals: readonly number[] = learningConfig.reviewIntervalsDays,
): ReviewUpdate {
  if (!correct) {
    return {
      action: 'put',
      item: { questionId, dueDate: addDays(today, intervals[0]), stage: 0, streak: 0, updatedAt: nowIso },
    }
  }
  // 復習リストにない問題に正解しても何もしない
  if (!current) return { action: 'none' }
  // 復習日より前に正解した場合は、予定を変えない（まぐれ当たりで間隔を広げない）
  if (current.dueDate > today) return { action: 'none' }
  const stage = current.stage + 1
  if (stage >= intervals.length) return { action: 'remove' }
  return {
    action: 'put',
    item: { questionId, dueDate: addDays(today, intervals[stage]), stage, streak: current.streak + 1, updatedAt: nowIso },
  }
}

/** 今日までに復習日が来ている問題（古い順） */
export function dueItems(items: ReviewItem[], today: string): ReviewItem[] {
  return items.filter((i) => i.dueDate <= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}
