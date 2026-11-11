import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { guideLabel } from '../components/QuestionCard'
import { SourceList } from '../components/SourceList'
import { Badge, Button, Card, Notice } from '../components/ui'
import { categoryLabel, importanceLabels } from '../config/labels'
import { content } from '../content'
import { useFavorite } from '../hooks/useFavorite'
import { useStore } from '../hooks/useStore'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { storage } from '../storage'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-bold text-navy-900">{title}</h3>
      <div className="mt-1 text-base leading-relaxed">{children}</div>
    </div>
  )
}
const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5">
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ul>
)

export function ServiceDetail() {
  const { serviceId = '' } = useParams()
  const service = content.services.find((s) => s.id === serviceId)
  const [tab, setTab] = useState<'beginner' | 'exam'>('beginner')
  const progress = useStore('serviceProgress')
  const favorite = useFavorite('service', serviceId)
  useStudyTimer('services')

  const current = progress.data.find((p) => p.serviceId === serviceId)
  const loaded = !progress.loading

  // 開いた日時を記録する（学習済みの状態は変えない）
  useEffect(() => {
    if (!service || !loaded) return
    const now = new Date().toISOString()
    void storage.put('serviceProgress', { serviceId: service.id, learned: current?.learned ?? false, lastViewedAt: now, updatedAt: now }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?.id, loaded])

  if (!service) {
    return (
      <Notice tone="warn" title="サービスが見つかりません">
        <Link to="/services" className="underline">
          サービス図鑑に戻る
        </Link>
      </Notice>
    )
  }

  const toggleLearned = () => {
    const now = new Date().toISOString()
    void storage.put('serviceProgress', { serviceId: service.id, learned: !current?.learned, lastViewedAt: now, updatedAt: now }).catch(() => {})
  }

  const byId = (ids: string[]) => ids.map((id) => content.services.find((s) => s.id === id)).filter((s) => s !== undefined)
  const similar = byId(service.similarServiceIds)
  const related = byId(service.relatedServiceIds)
  const groups = content.comparisons.filter((c) => service.comparisonGroupIds.includes(c.id))
  const questionCount = content.questions.filter((q) => q.serviceIds.includes(service.id)).length
  const domainNames = service.examDomains
    .map((d) => {
      const spec = content.exams.find((e) => e.exam === d.exam)
      const domain = spec?.domains.find((x) => x.id === d.domainId)
      return spec && domain ? `${spec.code}：${domain.title}` : null
    })
    .filter((x) => x !== null)

  const tabClass = (active: boolean) =>
    `min-h-11 flex-1 rounded-xl px-3 text-base font-bold ${active ? 'bg-navy-800 text-white' : 'border border-navy-100 bg-white text-navy-800'}`

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link to="/services" className="text-base font-semibold text-navy-700 underline">
          ← サービス図鑑
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{service.name}</h1>
        <p className="mt-1 text-base leading-relaxed text-navy-700">{service.summary}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{categoryLabel(service.category)}</Badge>
          <Badge>CLF 重要度 {importanceLabels[service.importance.clf]}</Badge>
          <Badge>SAA 重要度 {importanceLabels[service.importance.saa]}</Badge>
        </div>
        <p className="mt-1 text-sm text-navy-700">重要度は、このアプリが学習の優先順位として付けた目安です。</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant={current?.learned ? 'primary' : 'secondary'} aria-pressed={current?.learned ?? false} onClick={toggleLearned}>
            {current?.learned ? '✓ 学習済み' : '学習済みにする'}
          </Button>
          <Button variant={favorite.on ? 'primary' : 'secondary'} aria-pressed={favorite.on} onClick={favorite.toggle}>
            {favorite.on ? '★ お気に入り' : '☆ お気に入りに追加'}
          </Button>
        </div>
      </header>

      {groups.map((g) => (
        <Link key={g.id} to={`/compare/${g.id}`} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-navy-800 p-4 text-white">
          <span>
            <span className="block text-sm text-navy-100">類似サービスと比べる</span>
            <span className="block text-base font-bold">{g.title}</span>
          </span>
          <span className="rounded-full bg-brand-500 px-3 py-1 text-sm font-bold text-navy-900">比較へ</span>
        </Link>
      ))}

      <Card>
        <div className="mb-4 flex gap-2" role="tablist" aria-label="説明の切り替え">
          <button type="button" role="tab" aria-selected={tab === 'beginner'} onClick={() => setTab('beginner')} className={tabClass(tab === 'beginner')}>
            初心者向け
          </button>
          <button type="button" role="tab" aria-selected={tab === 'exam'} onClick={() => setTab('exam')} className={tabClass(tab === 'exam')}>
            試験対策
          </button>
        </div>
        {tab === 'beginner' ? (
          <div className="flex flex-col gap-4" role="tabpanel">
            <div className="rounded-xl border-l-4 border-brand-500 bg-brand-50 p-3">
              <p className="text-sm font-bold text-navy-700">たとえると</p>
              <p className="mt-1 text-base leading-relaxed">{service.beginner.analogy}</p>
            </div>
            <p className="text-base leading-relaxed">{service.beginner.description}</p>
            <Section title="主な用途">
              <List items={service.useCases} />
            </Section>
            <Section title="利用する具体的な場面">
              <List items={service.scenes} />
            </Section>
          </div>
        ) : (
          <div className="flex flex-col gap-4" role="tabpanel">
            <p className="text-base leading-relaxed">{service.exam.description}</p>
            <Section title="試験で重要なポイント">
              <List items={service.exam.points} />
            </Section>
            {domainNames.length > 0 && (
              <Section title="関連する試験分野">
                <List items={domainNames} />
              </Section>
            )}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <Section title="仕組み">{service.mechanism}</Section>
          <Section title="メリット">
            <List items={service.pros} />
          </Section>
          <Section title="デメリット・制約">
            <List items={service.cons} />
          </Section>
        </div>
      </Card>

      {(similar.length > 0 || related.length > 0) && (
        <Card>
          <div className="flex flex-col gap-4">
            {[
              { title: '類似サービス', list: similar },
              { title: '関連サービス', list: related },
            ]
              .filter((g) => g.list.length > 0)
              .map((g) => (
                <div key={g.title}>
                  <h3 className="text-base font-bold">{g.title}</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {g.list.map((s) => (
                      <li key={s.id}>
                        <Link to={`/services/${s.id}`} className="inline-flex min-h-11 items-center rounded-full border border-navy-600 px-3 font-semibold">
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {questionCount > 0 && (
          <Link to={`/practice/run?mode=service&service=${service.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-brand-500 px-4 font-bold text-navy-900">
            このサービスの問題を解く（{questionCount}問）
          </Link>
        )}
        <a href={service.docUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-navy-600 bg-white px-4 font-bold">
          公式ドキュメントを開く
        </a>
      </div>

      <SourceList sources={service.sources} verifiedAt={service.verifiedAt} uncertainNote={service.uncertainNote} guide={guideLabel(service.basedOnGuide)} />
    </div>
  )
}
