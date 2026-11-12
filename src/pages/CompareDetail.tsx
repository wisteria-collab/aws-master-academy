import { BackLink, usePageTitle } from '../components/Navigation'
import { useSessionState } from '../hooks/useSessionState'
import { Link, useParams } from 'react-router-dom'
import { guideLabel } from '../components/QuestionCard'
import { PricingCard } from '../components/PricingCard'
import { SourceList } from '../components/SourceList'
import { Button, Card, CardTitle, Notice } from '../components/ui'
import { content } from '../content'
import { comparisonAxes, type ComparisonGroup } from '../content/schema'
import { Figure } from '../figures'
import { useStudyTimer } from '../hooks/useStudyTimer'

const cols: Record<number, string> = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' }

/** 質問に「はい／いいえ」で答えていくと、適したサービスにたどり着く */
function DecisionFlow({ group }: { group: ComparisonGroup }) {
  const start = group.decisionFlow[0]?.id
  const [path, setPath] = useSessionState<{ id: string; answer?: 'yes' | 'no' }[]>('flow', start ? [{ id: start }] : [])
  if (!start) return null
  const node = (id: string) => group.decisionFlow.find((n) => n.id === id)
  const answer = (index: number, a: 'yes' | 'no') => {
    const n = node(path[index].id)
    const nextId = a === 'yes' ? n?.yes : n?.no
    setPath([...path.slice(0, index), { id: path[index].id, answer: a }, ...(nextId ? [{ id: nextId }] : [])])
  }

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {path.map((step, i) => {
        const n = node(step.id)
        if (!n) return null
        if (n.question) {
          return (
            <div key={step.id} className="rounded-xl border border-navy-100 p-3">
              <p className="text-base font-bold">
                質問{i + 1}：{n.question}
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant={step.answer === 'yes' ? 'primary' : 'secondary'} aria-pressed={step.answer === 'yes'} onClick={() => answer(i, 'yes')} className="flex-1">
                  はい
                </Button>
                <Button variant={step.answer === 'no' ? 'primary' : 'secondary'} aria-pressed={step.answer === 'no'} onClick={() => answer(i, 'no')} className="flex-1">
                  いいえ
                </Button>
              </div>
            </div>
          )
        }
        const item = group.items.find((x) => x.key === n.resultItemKey)
        return (
          <div key={step.id} className="rounded-xl border-2 border-brand-500 bg-brand-50 p-4">
            <p className="text-sm font-bold text-navy-700">この条件に合うのは</p>
            <p className="text-xl font-bold">{item?.label}</p>
            <p className="mt-1 text-base leading-relaxed">{item?.oneLine}</p>
            {n.note && <p className="mt-1 text-base leading-relaxed">{n.note}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {item?.serviceId && (
                <Link to={`/services/${item.serviceId}`} className="inline-flex min-h-11 items-center rounded-xl border border-navy-600 bg-white px-4 font-bold">
                  図鑑で詳しく見る
                </Link>
              )}
              <Button onClick={() => setPath([{ id: start }])}>最初からやり直す</Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CompareDetail() {
  const { groupId } = useParams()
  const group = content.comparisons.find((g) => g.id === groupId)
  useStudyTimer('compare')
  usePageTitle(group ? `比較「${group.title}」` : '類似サービス比較')

  if (!group) {
    return (
      <Notice tone="warn" title="比較グループが見つかりません">
        <Link to="/compare" className="underline">
          比較の一覧に戻る
        </Link>
      </Notice>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <BackLink fallback="/compare" fallbackLabel="類似サービス比較" />
        <h1 className="mt-2 text-2xl font-bold">{group.title}</h1>
        <p className="mt-1 text-base leading-relaxed text-navy-700">{group.summary}</p>
      </header>

      <Link to={`/compare/${group.id}/training`} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-brand-500 p-4 text-navy-900">
        <span>
          <span className="block text-lg font-bold">選択トレーニングを始める</span>
          <span className="block text-sm">要件からサービスを選ぶ・条件が変わると正解が変わる（{group.trainingQuestionIds.length}問）</span>
        </span>
        <span aria-hidden="true" className="text-2xl font-bold">→</span>
      </Link>

      <Card>
        <CardTitle>ひとことで言うと</CardTitle>
        <ul className={`grid gap-3 ${cols[group.items.length] ?? ''}`}>
          {group.items.map((i) => (
            <li key={i.key} className="rounded-xl bg-navy-50 p-3">
              <p className="text-base font-bold">{i.label}</p>
              <p className="mt-1 text-base leading-relaxed">{i.oneLine}</p>
            </li>
          ))}
        </ul>
      </Card>

      {group.figureIds.length > 0 && (
        <Card>
          <CardTitle>仕組みの違い</CardTitle>
          {group.figureIds.map((f) => (
            <div key={f} className="rounded-xl bg-navy-50 p-1">
              <Figure id={f} />
            </div>
          ))}
        </Card>
      )}

      {group.decisionFlow.length > 0 && (
        <Card>
          <CardTitle>どれを選ぶ？ 判断フロー</CardTitle>
          <DecisionFlow group={group} />
        </Card>
      )}

      <section aria-labelledby="axes-title" className="flex flex-col gap-3">
        <h2 id="axes-title" className="text-lg font-bold">
          12項目で比べる
        </h2>
        {comparisonAxes.map((axis) => (
          <Card key={axis.key}>
            <h3 className="mb-2 text-base font-bold text-navy-900">{axis.label}</h3>
            <dl className={`grid gap-2 ${cols[group.items.length] ?? ''}`}>
              {group.items.map((i) => (
                <div key={i.key} className="rounded-xl bg-navy-50 p-3">
                  <dt className="text-sm font-bold text-navy-700">{i.label}</dt>
                  <dd className="mt-0.5 text-base leading-relaxed">{i.values[axis.key]}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </section>

      <PricingCard
        services={[...new Map(group.items.flatMap((i) => (i.serviceId ? [i.serviceId] : [])).map((id) => [id, content.services.find((x) => x.id === id)])).values()]
          .filter((x) => x !== undefined)
          .map((x) => ({ name: x.name, pricingUrl: x.pricingUrl, pricingNote: x.pricingNote }))}
      />

      <BackLink fallback="/compare" fallbackLabel="類似サービス比較" />

      <SourceList sources={group.sources} verifiedAt={group.verifiedAt} uncertainNote={group.uncertainNote} guide={guideLabel(group.basedOnGuide)} />
    </div>
  )
}
