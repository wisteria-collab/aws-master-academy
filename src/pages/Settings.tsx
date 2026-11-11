import { useEffect, useRef, useState } from 'react'
import { RecordTabs } from '../components/RecordTabs'
import { SourceList } from '../components/SourceList'
import { Button, Card, CardTitle, Notice, PageHeader } from '../components/ui'
import { appInfo } from '../config/app'
import { content, contentCounts } from '../content'
import type { ContentKind } from '../content/schema'
import { useStorageHealth } from '../hooks/useStorageHealth'
import { formatDateTime } from '../logic/dates'
import { storage, storageEstimate, storeLabels, storeNames, type StoreName } from '../storage'
import { backupFileName, createBackup, importBackup, parseBackup, type BackupFile, type ImportMode } from '../storage/backup'
import { useSettings } from '../storage/settings'

type Message = { tone: 'good' | 'error'; title: string; body?: string }

const kindLabels: Record<ContentKind, string> = {
  exams: '試験仕様',
  lessons: 'レッスン',
  services: 'サービス',
  comparisons: '比較グループ',
  questions: '問題',
  diagrams: 'お手本構成',
  challenges: '設計問題',
  glossary: '用語',
}

function useCounts() {
  const [counts, setCounts] = useState<Record<StoreName, number> | null>(null)
  useEffect(() => {
    let alive = true
    const load = () =>
      storage
        .dump()
        .then((d) => {
          if (alive) setCounts(Object.fromEntries(storeNames.map((s) => [s, d[s].length])) as Record<StoreName, number>)
        })
        .catch(() => alive && setCounts(null))
    void load()
    const off = storage.subscribe(() => void load())
    return () => {
      alive = false
      off()
    }
  }, [])
  return counts
}

function BackupSection() {
  const settings = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [pending, setPending] = useState<{ backup: BackupFile; counts: Record<StoreName, number>; name: string } | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [busy, setBusy] = useState(false)

  const exportNow = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const backup = await createBackup(storage)
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backupFileName()
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
      settings.markBackupDone(backup.exportedAt)
      setMessage({
        tone: 'good',
        title: 'バックアップを書き出しました',
        body: 'ダウンロードしたファイルを、端末の「ファイル」やクラウドストレージなど消えない場所に保管してください。',
      })
    } catch (e) {
      setMessage({ tone: 'error', title: '書き出しに失敗しました', body: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const onFile = async (file: File | undefined) => {
    setMessage(null)
    setPending(null)
    setConfirmReplace(false)
    if (!file) return
    const result = parseBackup(await file.text())
    if (!result.ok) {
      setMessage({ tone: 'error', title: '読み込めませんでした', body: `${result.error} 今のデータは変更していません。` })
    } else {
      setPending({ backup: result.backup, counts: result.counts, name: file.name })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const run = async (mode: ImportMode) => {
    if (!pending) return
    setBusy(true)
    try {
      await importBackup(storage, pending.backup, mode)
      setMessage({
        tone: 'good',
        title: mode === 'merge' ? 'バックアップを今のデータに統合しました' : 'バックアップの内容で置き換えました',
      })
      setPending(null)
      setConfirmReplace(false)
    } catch (e) {
      setMessage({
        tone: 'error',
        title: '読み込みに失敗しました',
        body: `今のデータは変更していません。${e instanceof Error ? e.message : ''}`,
      })
    } finally {
      setBusy(false)
    }
  }

  const total = pending ? Object.values(pending.counts).reduce((a, b) => a + b, 0) : 0

  return (
    <Card>
      <CardTitle>バックアップ</CardTitle>
      <p className="text-base leading-relaxed text-navy-800">
        学習データを1つのJSONファイルに書き出します。機種変更やブラウザのデータ消去に備えて、定期的に保存してください。
      </p>
      <p className="mt-2 text-base text-navy-700">
        最後の書き出し：{settings.lastBackupAt ? formatDateTime(settings.lastBackupAt) : 'まだありません'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => void exportNow()} disabled={busy}>
          バックアップを書き出す
        </Button>
        <Button onClick={() => fileRef.current?.click()} disabled={busy}>
          バックアップを読み込む
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="バックアップファイルを選ぶ"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>

      {pending && (
        <div className="mt-4 rounded-xl border border-navy-100 bg-navy-50 p-4">
          <p className="font-bold break-words">{pending.name}</p>
          <p className="text-base text-navy-700">
            書き出し日時：{formatDateTime(pending.backup.exportedAt)}・合計 {total} 件
          </p>
          <ul className="mt-2 grid grid-cols-1 gap-x-4 text-base sm:grid-cols-2">
            {storeNames.map((s) => (
              <li key={s} className="flex justify-between border-b border-navy-100 py-1">
                <span>{storeLabels[s]}</span>
                <span className="font-semibold">{pending.counts[s]}件</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-base leading-relaxed text-navy-800">
            <b>統合</b>は今のデータを残したまま追加します（同じ項目は新しいほうを残します）。<b>置き換え</b>は今のデータをすべて消してから読み込みます。
          </p>
          {!confirmReplace ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => void run('merge')} disabled={busy}>
                今のデータに統合する
              </Button>
              <Button onClick={() => setConfirmReplace(true)} disabled={busy}>
                置き換える…
              </Button>
              <Button onClick={() => setPending(null)} disabled={busy}>
                やめる
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <p className="font-bold text-red-800">今の学習データはすべて消えます。よろしいですか？</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="danger" onClick={() => void run('replace')} disabled={busy}>
                  消して置き換える
                </Button>
                <Button onClick={() => setConfirmReplace(false)} disabled={busy}>
                  戻る
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {message && (
        <div className="mt-4">
          <Notice tone={message.tone} title={message.title}>
            {message.body}
          </Notice>
        </div>
      )}
    </Card>
  )
}

function StorageSection() {
  const health = useStorageHealth()
  const counts = useCounts()
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null)
  useEffect(() => {
    void storageEstimate().then(setEstimate)
  }, [])

  return (
    <Card>
      <CardTitle>保存の状態</CardTitle>
      {health.state === 'checking' && <p className="text-base">確認中…</p>}
      {health.state === 'unavailable' && (
        <Notice tone="error" title="このブラウザでは学習履歴を保存できません">
          プライベートブラウズを使っている場合は、通常のウィンドウで開き直してください。（{health.reason}）
        </Notice>
      )}
      {health.state === 'ok' && (
        <>
          <Notice
            tone={health.persisted ? 'good' : 'info'}
            title={health.persisted ? '保存できています（ブラウザが自動で消さない設定です）' : '保存できています'}
          >
            {health.persisted
              ? 'ブラウザを閉じても学習履歴は残ります。'
              : 'ブラウザを閉じても学習履歴は残ります。ただし端末の空き容量が少なくなると、ブラウザが古いサイトのデータを消すことがあります。定期的なバックアップをおすすめします。'}
          </Notice>
          <ul className="mt-3 grid grid-cols-1 gap-x-4 text-base sm:grid-cols-2">
            {storeNames.map((s) => (
              <li key={s} className="flex justify-between border-b border-navy-100 py-1.5">
                <span>{storeLabels[s]}</span>
                <span className="font-semibold">{counts ? `${counts[s]}件` : '—'}</span>
              </li>
            ))}
          </ul>
          {estimate && estimate.quota > 0 && (
            <p className="mt-3 text-sm text-navy-700">
              このサイトの使用量：約 {(estimate.usage / 1024 / 1024).toFixed(1)} MB（上限の目安 {(estimate.quota / 1024 / 1024 / 1024).toFixed(1)} GB）
            </p>
          )}
        </>
      )}
    </Card>
  )
}

function DisplaySection() {
  const { fontSize, setFontSize } = useSettings()
  return (
    <Card>
      <CardTitle>表示</CardTitle>
      <fieldset>
        <legend className="text-base font-semibold">文字の大きさ</legend>
        <div className="mt-2 flex gap-2">
          {(['normal', 'large'] as const).map((v) => (
            <Button key={v} variant={fontSize === v ? 'primary' : 'secondary'} aria-pressed={fontSize === v} onClick={() => setFontSize(v)}>
              {v === 'normal' ? '標準' : '大きめ'}
            </Button>
          ))}
        </div>
      </fieldset>
    </Card>
  )
}

function SourcesSection() {
  const kinds = Object.keys(contentCounts) as ContentKind[]
  return (
    <Card>
      <CardTitle>教材の出典と確認日</CardTitle>
      <p className="text-base leading-relaxed text-navy-800">
        教材はAWS公式情報と照合し、確認できたものだけを公開しています。各教材の画面にも出典と最終確認日を表示します。
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 text-base sm:grid-cols-4">
        {kinds.map((k) => (
          <li key={k} className="flex justify-between border-b border-navy-100 py-1.5">
            <span>{kindLabels[k]}</span>
            <span className="font-semibold">{contentCounts[k].verified}件</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-3">
        {content.exams.map((e) => (
          <div key={e.id}>
            <p className="mb-1 text-base font-bold">試験仕様：{e.code}</p>
            <SourceList sources={e.sources} verifiedAt={e.verifiedAt} uncertainNote={e.uncertainNote} guide={`${e.code} 試験ガイド Version ${e.guideVersion}`} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function DangerSection() {
  const settings = useSettings()
  const [step, setStep] = useState<0 | 1>(0)
  const [done, setDone] = useState<Message | null>(null)

  const wipe = async () => {
    try {
      await storage.clearAll()
      settings.reset()
      setDone({ tone: 'good', title: '学習データをすべて削除しました' })
    } catch (e) {
      setDone({ tone: 'error', title: '削除に失敗しました', body: e instanceof Error ? e.message : undefined })
    }
    setStep(0)
  }

  return (
    <Card>
      <CardTitle>データの削除</CardTitle>
      <p className="text-base leading-relaxed text-navy-800">
        この端末に保存された学習履歴・進捗・構成図・設定をすべて削除します。元に戻せないため、先にバックアップを書き出してください。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {step === 0 ? (
          <Button onClick={() => setStep(1)}>すべての学習データを削除…</Button>
        ) : (
          <>
            <Button variant="danger" onClick={() => void wipe()}>
              本当に削除する
            </Button>
            <Button onClick={() => setStep(0)}>やめる</Button>
          </>
        )}
      </div>
      {done && (
        <div className="mt-3">
          <Notice tone={done.tone} title={done.title}>
            {done.body}
          </Notice>
        </div>
      )}
    </Card>
  )
}

export function Settings() {
  return (
    <div>
      <PageHeader title="設定・バックアップ" />
      <RecordTabs />
      <div className="flex flex-col gap-5">
        <BackupSection />
        <StorageSection />
        <DisplaySection />
        <SourcesSection />
        <DangerSection />
        <Card>
          <CardTitle>このアプリについて</CardTitle>
          <p className="text-base leading-relaxed text-navy-800">{appInfo.disclaimer}</p>
          <p className="mt-2 text-base leading-relaxed text-navy-800">
            学習データはこの端末のブラウザ内だけに保存され、外部には送信されません。AWSアカウントへの接続や課金は発生しません。
          </p>
        </Card>
      </div>
    </div>
  )
}
