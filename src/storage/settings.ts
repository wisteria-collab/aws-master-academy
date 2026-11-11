/**
 * 表示設定など、小さくてすぐ読みたい値は LocalStorage に保存する。
 * 学習履歴は IndexedDB（storage/index.ts）側。
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Settings {
  fontSize: 'normal' | 'large'
  /** 最後にバックアップを書き出した日時 */
  lastBackupAt: string | null
  /** バックアップの案内を閉じた日（その日は再表示しない） */
  backupReminderDismissedOn: string | null
  setFontSize: (v: Settings['fontSize']) => void
  markBackupDone: (iso: string) => void
  dismissBackupReminder: (date: string) => void
  reset: () => void
}

const initial = { fontSize: 'normal' as const, lastBackupAt: null, backupReminderDismissedOn: null }

/** LocalStorage が使えない環境では、メモリ上だけで動かす */
function safeStorage(): Storage {
  try {
    const k = '__ama_test__'
    window.localStorage.setItem(k, '1')
    window.localStorage.removeItem(k)
    return window.localStorage
  } catch {
    const mem = new Map<string, string>()
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: (k) => void mem.delete(k),
      clear: () => mem.clear(),
      key: () => null,
      length: 0,
    }
  }
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      ...initial,
      setFontSize: (fontSize) => set({ fontSize }),
      markBackupDone: (lastBackupAt) => set({ lastBackupAt }),
      dismissBackupReminder: (backupReminderDismissedOn) => set({ backupReminderDismissedOn }),
      reset: () => set({ ...initial }),
    }),
    { name: 'ama:settings', version: 1, storage: createJSONStorage(safeStorage) },
  ),
)
