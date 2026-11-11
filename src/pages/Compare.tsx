import { usePageTitle } from '../components/Navigation'
import { Link } from 'react-router-dom'
import { ChevronIcon } from '../components/icons'
import { Badge, Card, PageHeader } from '../components/ui'
import { categoryLabel } from '../config/labels'
import { content } from '../content'
import { useStore } from '../hooks/useStore'
import { accuracy, formatRate, latestAttempts } from '../logic/stats'

/** 比較グループの公開予定（Phase 4 で順に追加する） */
const planned = [
  'ネットワーク（ALB・NLB・GWLB・CloudFront・Route 53）',
  '可用性（Multi-AZ・Read Replica・バックアップ）',
  'S3ストレージクラス',
  'ロードバランサーの種類 ほか',
]

export function Compare() {
  const attempts = useStore('attempts')
  usePageTitle('類似サービス比較')
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="類似サービス比較" lead="似たサービスを比べて違いを理解し、要件から選ぶ練習をします。" />

      <ul className="flex flex-col gap-3">
        {content.comparisons.map((g) => {
          const ids = new Set(g.trainingQuestionIds)
          const acc = accuracy(latestAttempts(attempts.data.filter((a) => ids.has(a.questionId))))
          return (
            <li key={g.id}>
              <Link to={`/compare/${g.id}`} className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm transition-colors hover:border-brand-500">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-navy-700">{categoryLabel(g.category)}</span>
                  <span className="block text-lg font-bold">{g.title}</span>
                  <span className="mt-1 block text-base leading-relaxed text-navy-700">{g.summary}</span>
                  <span className="mt-2 flex flex-wrap gap-2">
                    <Badge>トレーニング {g.trainingQuestionIds.length}問</Badge>
                    <Badge tone={acc.rate === null ? 'neutral' : 'good'}>
                      {acc.rate === null ? '未挑戦' : `正答率 ${formatRate(acc.rate)}（${acc.answered}問解答）`}
                    </Badge>
                  </span>
                </span>
                <ChevronIcon className="h-5 w-5 shrink-0 text-navy-600" />
              </Link>
            </li>
          )
        })}
      </ul>

      <Card>
        <h2 className="text-lg font-bold">今後追加する比較グループ</h2>
        <p className="mt-1 text-base leading-relaxed text-navy-700">AWS公式情報と照合できたものから公開します（Phase 4）。</p>
        <ul className="mt-2 list-disc pl-5 text-base leading-relaxed">
          {planned.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
