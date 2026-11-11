/**
 * アプリ全体で使う保存層。保存先を差し替えるときはここだけを変更する。
 */
import type { StorageAdapter } from './adapter'
import { DexieAdapter } from './dexieAdapter'

const dexie = new DexieAdapter()

export const storage: StorageAdapter = dexie

export type StorageHealth =
  | { state: 'checking' }
  | { state: 'ok'; persisted: boolean | null }
  | { state: 'unavailable'; reason: string }

/**
 * 保存できる状態かを確認し、ブラウザに「消さずに保存し続ける」よう要求する。
 * persisted が false の場合、端末の空き容量が少ないときにブラウザがデータを消すことがある。
 */
export async function checkStorage(): Promise<StorageHealth> {
  try {
    await dexie.open()
  } catch (e) {
    return {
      state: 'unavailable',
      reason: e instanceof Error ? e.message : 'このブラウザでは保存領域を開けませんでした',
    }
  }
  let persisted: boolean | null = null
  try {
    if (navigator.storage?.persist) {
      persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist())
    }
  } catch {
    persisted = null
  }
  return { state: 'ok', persisted }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage?.estimate) return null
    const e = await navigator.storage.estimate()
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 }
  } catch {
    return null
  }
}

export * from './records'
export type { StorageAdapter } from './adapter'
