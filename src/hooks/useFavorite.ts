import { storage, type Favorite } from '../storage'
import { useStore } from './useStore'

/** お気に入りの状態と切り替え */
export function useFavorite(type: Favorite['type'], refId: string) {
  const { data } = useStore('favorites')
  const id = `${type}:${refId}`
  const on = data.some((f) => f.id === id)
  const toggle = () => {
    const op = on ? storage.remove('favorites', id) : storage.put('favorites', { id, type, refId, updatedAt: new Date().toISOString() })
    void op.catch(() => {})
  }
  return { on, toggle }
}
