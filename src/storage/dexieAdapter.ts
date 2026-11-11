/**
 * IndexedDB（Dexie）を使った保存層の実装。ブラウザを閉じてもデータが残る。
 */
import Dexie, { type Table } from 'dexie'
import type { ChangeListener, StorageAdapter } from './adapter'
import { emptyDump, storeNames, type StoreDump, type StoreMap, type StoreName } from './records'

export const DB_NAME = 'aws-master-academy'

export class DexieAdapter implements StorageAdapter {
  private db: Dexie
  private listeners = new Set<ChangeListener>()
  private channel: BroadcastChannel | undefined

  constructor(name: string = DB_NAME) {
    this.db = new Dexie(name)
    // 先頭が主キー、以降は検索に使う項目。項目を増やすときは version を上げる
    this.db.version(1).stores({
      lessonProgress: 'lessonId',
      serviceProgress: 'serviceId',
      attempts: 'id, questionId, sessionId, answeredAt',
      reviewItems: 'questionId, dueDate',
      examAttempts: 'id, exam, status',
      studySessions: 'id, date',
      diagrams: 'id, updatedAt',
      favorites: 'id, type',
    })
    // 別のタブで変更されたときにも画面を更新する
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(`${name}:changes`)
      this.channel.onmessage = (ev) => this.emit(ev.data as StoreName | '*', false)
    }
  }

  private table<S extends StoreName>(store: S): Table<StoreMap[S], string> {
    return this.db.table(store)
  }

  private emit(store: StoreName | '*', broadcast = true) {
    for (const l of this.listeners) l(store)
    if (broadcast) this.channel?.postMessage(store)
  }

  /** データベースを開けるか確認する。プライベートブラウズなどで使えない場合は例外になる */
  async open(): Promise<void> {
    await this.db.open()
  }

  async get<S extends StoreName>(store: S, key: string) {
    return this.table(store).get(key)
  }

  async getAll<S extends StoreName>(store: S) {
    return this.table(store).toArray()
  }

  async put<S extends StoreName>(store: S, value: StoreMap[S]) {
    await this.table(store).put(value)
    this.emit(store)
  }

  async bulkPut<S extends StoreName>(store: S, values: StoreMap[S][]) {
    if (values.length === 0) return
    await this.table(store).bulkPut(values)
    this.emit(store)
  }

  async remove(store: StoreName, key: string) {
    await this.table(store).delete(key)
    this.emit(store)
  }

  async dump(): Promise<StoreDump> {
    const out = emptyDump()
    await this.db.transaction('r', this.db.tables, async () => {
      for (const s of storeNames) {
        ;(out[s] as unknown[]) = await this.table(s).toArray()
      }
    })
    return out
  }

  async replaceAll(data: StoreDump) {
    await this.db.transaction('rw', this.db.tables, async () => {
      for (const s of storeNames) {
        await this.table(s).clear()
        await this.table(s).bulkPut(data[s] as never[])
      }
    })
    this.emit('*')
  }

  async clearAll() {
    await this.db.transaction('rw', this.db.tables, async () => {
      for (const s of storeNames) await this.table(s).clear()
    })
    this.emit('*')
  }

  subscribe(listener: ChangeListener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  close() {
    this.channel?.close()
    this.db.close()
  }
}
