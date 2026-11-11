import { useCallback, useRef, useState } from 'react'
import { useEntryId } from './useEntryId'

/**
 * 画面ごとの一時的な状態（検索条件、選択中のタブ、解答の途中経過など）を、
 * ブラウザの履歴の1件ごとに覚えておく。別の画面へ移動して「戻る」で戻ったときに復元される。
 * タブを閉じると消える（学習履歴そのものは IndexedDB に保存している）。
 */
export function useSessionState<T>(name: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const entryId = useEntryId()
  const key = useRef(`ama:ui:${entryId}:${name}`).current

  const [state, setState] = useState<T>(() => {
    try {
      const raw = window.sessionStorage.getItem(key)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })

  const set = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value
        try {
          window.sessionStorage.setItem(key, JSON.stringify(next))
        } catch {
          // 保存できなくても、画面の動作は続ける
        }
        return next
      })
    },
    [key],
  )

  return [state, set]
}
