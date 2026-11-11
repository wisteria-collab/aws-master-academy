/**
 * 学習データのバックアップ（JSONの書き出し・読み込み）。
 * 読み込み時は形式を検証し、壊れたファイルでは既存のデータを変更しない。
 */
import { z } from 'zod'
import type { StorageAdapter } from './adapter'
import {
  emptyDump,
  keyOf,
  SCHEMA_VERSION,
  storeNames,
  storeSchemas,
  type StoreDump,
  type StoreMap,
  type StoreName,
} from './records'

export const APP_ID = 'aws-master-academy'

export interface BackupFile {
  app: typeof APP_ID
  schemaVersion: number
  exportedAt: string
  stores: StoreDump
}

const envelopeSchema = z.object({
  app: z.literal(APP_ID),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string().min(1),
  stores: z.record(z.string(), z.array(z.unknown())),
})

export async function createBackup(adapter: StorageAdapter, now: Date = new Date()): Promise<BackupFile> {
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    stores: await adapter.dump(),
  }
}

export type ParseResult =
  | { ok: true; backup: BackupFile; counts: Record<StoreName, number> }
  | { ok: false; error: string }

/** バックアップファイルの文字列を検証する。データベースには触れない */
export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSONとして読み込めませんでした。ファイルが壊れている可能性があります。' }
  }
  const env = envelopeSchema.safeParse(raw)
  if (!env.success) {
    return { ok: false, error: 'このアプリのバックアップファイルではありません。' }
  }
  if (env.data.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'このバックアップは新しいバージョンのアプリで作られています。アプリを最新版に更新してから読み込んでください。',
    }
  }
  // 古い形式からの移行はここに追加する（現在はバージョン1のみ）

  const stores = emptyDump()
  const counts = {} as Record<StoreName, number>
  for (const s of storeNames) {
    const list = env.data.stores[s] ?? []
    const parsed = z.array(storeSchemas[s]).safeParse(list)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return {
        ok: false,
        error: `「${s}」のデータ形式が正しくありません（${first.path.join('.')}: ${first.message}）。`,
      }
    }
    ;(stores[s] as unknown[]) = parsed.data
    counts[s] = parsed.data.length
  }
  return {
    ok: true,
    backup: { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: env.data.exportedAt, stores },
    counts,
  }
}

/** 統合するとき、同じキーのデータのどちらを残すか */
function pick<S extends StoreName>(store: S, current: StoreMap[S], incoming: StoreMap[S]): StoreMap[S] {
  if (store === 'studySessions') {
    // 学習時間は長いほうを残す（同じ日の記録を二重に足さない）
    const a = current as StoreMap['studySessions']
    const b = incoming as StoreMap['studySessions']
    return (b.seconds > a.seconds ? b : a) as StoreMap[S]
  }
  const a = (current as { updatedAt?: string; answeredAt?: string }).updatedAt ?? (current as { answeredAt?: string }).answeredAt ?? ''
  const b = (incoming as { updatedAt?: string; answeredAt?: string }).updatedAt ?? (incoming as { answeredAt?: string }).answeredAt ?? ''
  return b > a ? incoming : current
}

export function mergeDumps(current: StoreDump, incoming: StoreDump): StoreDump {
  const out = emptyDump()
  for (const s of storeNames) {
    const map = new Map<string, StoreMap[typeof s]>()
    for (const v of current[s]) map.set(keyOf(s, v), v)
    for (const v of incoming[s]) {
      const k = keyOf(s, v)
      const prev = map.get(k)
      map.set(k, prev ? pick(s, prev, v) : v)
    }
    ;(out[s] as unknown[]) = [...map.values()]
  }
  return out
}

export type ImportMode = 'merge' | 'replace'

/**
 * @param mode merge: 今のデータに統合する / replace: 今のデータを消して置き換える
 */
export async function importBackup(adapter: StorageAdapter, backup: BackupFile, mode: ImportMode): Promise<void> {
  const next = mode === 'replace' ? backup.stores : mergeDumps(await adapter.dump(), backup.stores)
  await adapter.replaceAll(next)
}

export function backupFileName(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}`
  return `aws-master-academy-backup-${stamp}.json`
}
