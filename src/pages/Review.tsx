import { usePageTitle } from '../components/Navigation'
import { Link } from 'react-router-dom'
import { RecordTabs } from '../components/RecordTabs'
import { Card, CardTitle, EmptyState, PageHeader, Stat } from '../components/ui'
import { learningConfig } from '../config/learning'
import { content } from '../content'
import { useProgressSummary } from '../hooks/useProgressSummary'

export function Review() {
  const s = useProgressSummary()
  usePageTitle('復習')
  const [first, ...rest] = learningConfig.reviewIntervalsDays

  return (
    <div>
      <PageHeader title="苦手分野・復習" lead="間違えた問題を、忘れかけた頃にもう一度出題します。" />
      <RecordTabs />

      <div className="flex flex-col gap-5">
        <Card>
          <CardTitle>今日の復習</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="今日が復習日の問題" value={`${s.dueReviews.length}問`} />
            <Stat label="復習予定の合計" value={`${s.scheduledReviews}問`} />
          </div>
          {s.dueReviews.length > 0 && (
            <Link
              to="/practice/run?mode=review"
              className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-brand-500 px-4 text-base font-bold text-navy-900"
            >
              復習を始める（{s.dueReviews.length}問）
            </Link>
          )}
          {s.dueReviews.length === 0 && (
            <div className="mt-3">
              <EmptyState title="今日の復習はありません">
                {s.scheduledReviews === 0
                  ? '問題演習で間違えた問題が、自動でここに追加されます。'
                  : '次の復習日になると、ここに問題が表示されます。'}
              </EmptyState>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>復習の仕組み</CardTitle>
          <ol className="list-decimal pl-5 text-base leading-relaxed text-navy-800">
            <li>間違えた問題は、{first}日後にもう一度出題します。</li>
            <li>
              復習で正解するたびに、{rest.map((d) => `${d}日後`).join(' → ')} と間隔を広げます。
            </li>
            <li>最後まで正解できたら、復習リストから外れます。</li>
            <li>途中で間違えたら、{first}日後からやり直します。</li>
          </ol>
        </Card>

        <Card>
          <CardTitle>お気に入り</CardTitle>
          {s.favorites.length === 0 ? (
            <EmptyState title="お気に入りはまだありません">
              サービスや問題を登録すると、ここからすぐ開けます。
            </EmptyState>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {s.favorites.map((f) => {
                const service = f.type === 'service' ? content.services.find((x) => x.id === f.refId) : undefined
                return service ? (
                  <li key={f.id}>
                    <Link to={`/services/${service.id}`} className="inline-flex min-h-11 items-center rounded-full border border-navy-600 px-3 font-semibold">
                      ★ {service.name}
                    </Link>
                  </li>
                ) : null
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
