import { useEffect, useState } from 'react'
import { storage, type StoreMap, type StoreName } from '../storage'

/** ストアの全データを読み込み、変更があれば自動で読み直す */
export function useStore<S extends StoreName>(store: S): { data: StoreMap[S][]; loading: boolean } {
  const [state, setState] = useState<{ data: StoreMap[S][]; loading: boolean }>({ data: [], loading: true })

  useEffect(() => {
    let alive = true
    const load = () => {
      storage
        .getAll(store)
        .then((data) => alive && setState({ data, loading: false }))
        .catch(() => alive && setState({ data: [], loading: false }))
    }
    load()
    const unsubscribe = storage.subscribe((changed) => {
      if (changed === store || changed === '*') load()
    })
    return () => {
      alive = false
      unsubscribe()
    }
  }, [store])

  return state
}
