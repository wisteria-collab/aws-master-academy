import { useLocation } from 'react-router-dom'

/**
 * ブラウザの履歴の1件ごとに固有のIDを付ける。
 * 画面の状態やスクロール位置を「履歴のどの1件のものか」で覚えるために使う。
 * （URLを直接開いた場合など、ルーターが区別できない履歴も区別できるようにする）
 */
export function getEntryId(): string {
  const state = window.history.state as Record<string, unknown> | null
  if (state && typeof state.amaId === 'string') return state.amaId
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  try {
    window.history.replaceState({ ...(state ?? {}), amaId: id }, '')
  } catch {
    // 履歴を書き換えられない環境では、そのまま使う
  }
  return id
}

export function useEntryId(): string {
  useLocation() // 画面の移動のたびに読み直す
  return getEntryId()
}
