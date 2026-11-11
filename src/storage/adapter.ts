/**
 * 保存層の共通の窓口。
 * 画面や学習ロジックはこのインターフェースだけを使い、保存先（IndexedDB など）を直接触らない。
 * 将来、端末間で同期する保存先を追加するときは、このインターフェースを実装したクラスを足す。
 */
import type { StoreDump, StoreMap, StoreName } from './records'

export type ChangeListener = (store: StoreName | '*') => void

export interface StorageAdapter {
  get<S extends StoreName>(store: S, key: string): Promise<StoreMap[S] | undefined>
  getAll<S extends StoreName>(store: S): Promise<StoreMap[S][]>
  put<S extends StoreName>(store: S, value: StoreMap[S]): Promise<void>
  bulkPut<S extends StoreName>(store: S, values: StoreMap[S][]): Promise<void>
  remove(store: StoreName, key: string): Promise<void>
  /** 全ストアの中身を取り出す（バックアップ用） */
  dump(): Promise<StoreDump>
  /** 全ストアを指定の内容で置き換える。途中で失敗したら何も変えない */
  replaceAll(data: StoreDump): Promise<void>
  /** 全データを削除する */
  clearAll(): Promise<void>
  /** データが変わったときに通知を受け取る。戻り値は解除用の関数 */
  subscribe(listener: ChangeListener): () => void
}
