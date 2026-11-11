import { STALE_DAYS, daysBetween } from '../content/validate'
import { toLocalDate } from '../logic/dates'
import { Badge } from './ui'

interface Props {
  sources: { title: string; url: string }[]
  verifiedAt?: string
  uncertainNote?: string
  /** 基準にした公式試験ガイド（例：CLF-C02 試験ガイド Version 1.3） */
  guide?: string
}

/** 教材の出典と最終確認日。すべての教材画面の末尾に表示する */
export function SourceList({ sources, verifiedAt, uncertainNote, guide }: Props) {
  const stale = verifiedAt ? daysBetween(verifiedAt, toLocalDate(new Date())) > STALE_DAYS : false
  return (
    <div className="rounded-xl bg-navy-50 p-4 text-sm leading-relaxed text-navy-800">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold">出典</p>
        {verifiedAt && <span>最終確認日：{verifiedAt.replaceAll('-', '/')}</span>}
        {stale && <Badge tone="brand">要再確認</Badge>}
      </div>
      {guide && <p className="mt-1">基準：{guide}</p>}
      <ul className="mt-1 list-disc pl-5">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer" className="break-words underline">
              {s.title}
            </a>
          </li>
        ))}
      </ul>
      {uncertainNote && <p className="mt-2">注意：{uncertainNote}</p>}
      {stale && <p className="mt-2">確認日から時間がたっています。最新の情報は公式ページで確認してください。</p>}
    </div>
  )
}
