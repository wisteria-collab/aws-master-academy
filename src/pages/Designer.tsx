import { Link } from 'react-router-dom'
import { ChevronIcon } from '../components/icons'
import { usePageTitle } from '../components/Navigation'
import { Badge, Card, EmptyState, PageHeader } from '../components/ui'
import { content } from '../content'

/** お手本構成の公開予定のテーマ数 */
export const PLANNED_TEMPLATES = 8

export function Designer() {
  usePageTitle('構成図シミュレーター')
  const templates = [...content.diagrams].sort((a, b) => a.order - b.order)
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="構成図シミュレーター" lead="サービスを「どう組み合わせるか」を、図で学びます。まずはお手本の構成を読み解きましょう。" />

      <section aria-labelledby="dg-templates">
        <h2 id="dg-templates" className="text-xl font-bold">
          お手本構成
        </h2>
        <p className="mt-1 text-base leading-relaxed text-navy-700">
          公開中 {templates.length} / 予定 {PLANNED_TEMPLATES} テーマ。図の中の箱をタップすると、その構成での役割が表示されます。
        </p>
        {templates.length === 0 ? (
          <EmptyState title="お手本構成を準備中です">AWS公式情報と照合できたものから公開します。</EmptyState>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {templates.map((t) => (
              <li key={t.id}>
                <Link to={`/designer/templates/${t.id}`} className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm transition-colors hover:border-brand-500">
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold">{t.title}</span>
                    <span className="mt-1 block text-base leading-relaxed text-navy-700">{t.summary}</span>
                    <span className="mt-2 flex flex-wrap gap-2">
                      <Badge>サービス {new Set(t.diagram.nodes.filter((n) => n.serviceId).map((n) => n.serviceId)).size}種類</Badge>
                    </span>
                  </span>
                  <ChevronIcon className="h-5 w-5 shrink-0 text-navy-600" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card>
        <h2 className="text-lg font-bold">今後追加する機能（Phase 5）</h2>
        <ul className="mt-2 list-disc pl-5 text-base leading-relaxed text-navy-800">
          <li>自分で構成図を作る（サービスを置いて線でつなぐ。保存・読み込み）</li>
          <li>設計問題（企業の課題から構成を考え、観点別の講評を受ける）</li>
        </ul>
      </Card>
    </div>
  )
}
