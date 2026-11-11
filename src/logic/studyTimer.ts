import type { StorageAdapter } from '../storage/adapter'
import { toLocalDate } from './dates'

/** 学習時間を「日付×機能」の記録に加算する */
export async function addStudySeconds(
  adapter: StorageAdapter,
  feature: string,
  seconds: number,
  now: Date = new Date(),
): Promise<void> {
  if (seconds <= 0) return
  const date = toLocalDate(now)
  const id = `${date}:${feature}`
  const current = await adapter.get('studySessions', id)
  await adapter.put('studySessions', {
    id,
    date,
    feature,
    seconds: (current?.seconds ?? 0) + seconds,
    updatedAt: now.toISOString(),
  })
}
