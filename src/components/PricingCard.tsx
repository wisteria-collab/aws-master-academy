import { pricingLinks } from '../config/pricing'
import { Card } from './ui'

interface Props {
  /** サービスごとの公式の料金ページ（確認できたものだけ） */
  services?: { name: string; pricingUrl?: string; pricingNote?: string; pricingRefUrl?: string }[]
  /** 公式の入口のうち、表示する件数（既定は料金一覧と料金計算ツールの2件） */
  hubCount?: number
}

const linkClass = 'inline-flex min-h-11 items-center rounded-xl border border-navy-600 bg-white px-4 text-base font-bold'

/** 料金の案内。金額は変わるため教材には書かず、AWS公式のページへ案内する */
export function PricingCard({ services = [], hubCount = 2 }: Props) {
  const withPage = services.filter((s) => s.pricingUrl)
  const noteOnly = services.filter((s) => !s.pricingUrl && s.pricingNote)
  const without = services.filter((s) => !s.pricingUrl && !s.pricingNote)
  return (
    <Card>
      <h2 className="text-lg font-bold">料金を調べる（AWS公式）</h2>
      <p className="mt-1 text-sm leading-relaxed text-navy-700">料金は、リージョンや時期によって変わります。金額は、必ずAWS公式のページで確認してください。</p>
      {withPage.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3">
          {withPage.map((s) => (
            <li key={s.name}>
              {s.pricingNote && (
                <p className="mb-2 text-base leading-relaxed text-navy-900">
                  <span className="font-bold">{services.length > 1 ? `${s.name}：` : '料金がかかるもの：'}</span>
                  {s.pricingNote}
                </p>
              )}
              <a href={s.pricingUrl} target="_blank" rel="noreferrer" className={linkClass}>
                {s.name} の料金ページ（AWS公式）
              </a>
            </li>
          ))}
        </ul>
      )}
      {noteOnly.map((s) => (
        <p key={s.name} className="mt-3 text-base leading-relaxed text-navy-900">
          <span className="font-bold">{services.length > 1 ? `${s.name}：` : '料金：'}</span>
          {s.pricingNote}
          {s.pricingRefUrl && (
            <a href={s.pricingRefUrl} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-bold underline">
              {s.name} の料金についての根拠のページ（AWS公式）
            </a>
          )}
        </p>
      ))}
      {without.length > 0 && (
        <p className="mt-3 text-sm leading-relaxed text-navy-700">
          {services.length > 1 ? `${without.map((s) => s.name).join('、')} の` : 'このサービスの'}個別の料金ページは、まだ確認できていません。下の料金一覧から探してください。
        </p>
      )}
      <ul className="mt-3 flex flex-col gap-2">
        {pricingLinks.slice(0, hubCount).map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-navy-100 p-3 transition-colors hover:border-brand-500">
              <span className="text-base font-bold underline">{l.title}</span>
              <span className="block text-sm leading-relaxed text-navy-700">{l.note}</span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  )
}
