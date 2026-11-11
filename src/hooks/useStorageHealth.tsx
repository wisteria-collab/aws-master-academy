import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { checkStorage, type StorageHealth } from '../storage'

const Ctx = createContext<StorageHealth>({ state: 'checking' })

export function StorageHealthProvider({ children }: { children: ReactNode }) {
  const [health, setHealth] = useState<StorageHealth>({ state: 'checking' })
  useEffect(() => {
    let alive = true
    void checkStorage().then((h) => alive && setHealth(h))
    return () => {
      alive = false
    }
  }, [])
  return <Ctx.Provider value={health}>{children}</Ctx.Provider>
}

export function useStorageHealth(): StorageHealth {
  return useContext(Ctx)
}
