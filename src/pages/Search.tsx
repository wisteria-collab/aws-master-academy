import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../components/Navigation'
import { Card, EmptyState, PageHeader } from '../components/ui'
import { content } from '../content'
import { search, type SearchDoc, type SearchKind } from '../logic/search'

const kindLabel: Record<SearchKind, string> = { lesson: 'レッスン', service: 'サービス', comparison: '比較', term: '用語' }
const kindOrder: SearchKind[] = ['service', 'comparison', 'lesson', 'term']

function buildDocs(): SearchDoc[] {
  const docs: SearchDoc[] = []
  for (const l of content.lessons) {
    docs.push({
      kind: 'lesson',
      id: l.id,
      title: l.title,
      note: `${l.course.toUpperCase()} のレッスン`,
      body: `${l.overview} ${l.examPoints.join(' ')}`,
      to: `/learn/${l.course}/${l.id}`,
    })
  }
  for (const s of content.services) {
    docs.push({ kind: 'service', id: s.id, title: s.name, note: s.summary, body: `${s.aliases.join(' ')} ${s.exam.points.join(' ')}`, to: `/services/${s.id}` })
  }
  for (const c of content.comparisons) {
    docs.push({ kind: 'comparison', id: c.id, title: c.title, note: c.summary, body: c.items.map((i) => `${i.label} ${i.oneLine}`).join(' '), to: `/compare/${c.id}` })
  }
  for (const t of content.glossary) {
    docs.push({ kind: 'term', id: t.id, title: t.term, note: t.description, body: t.plain ?? '' })
  }
  return docs
}

export function Search() {
  usePageTitle('検索')
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const docs = useMemo(buildDocs, [])
  const hits = useMemo(() => search(docs, q), [docs, q])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="検索" lead="レッスン、サービス、比較、用語を、まとめて探せます。" />
      <Card>
        <label htmlFor="global-search" className="block text-base font-bold">
          探したい言葉
        </label>
        <input
          id="global-search"
          type="search"
          value={q}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          placeholder="例：S3、可用性、NAT"
          autoComplete="off"
          className="mt-2 min-h-12 w-full rounded-xl border border-navy-600 bg-white px-4 text-lg"
        />
        <p className="mt-2 text-sm text-navy-700">空白で区切ると、すべての言葉を含むものだけに絞れます。</p>
      </Card>

      {q.trim() === '' ? null : hits.length === 0 ? (
        <EmptyState title="見つかりませんでした">言葉を短くするか、別の言い方で試してください。</EmptyState>
      ) : (
        <>
          <p className="text-base font-semibold" role="status">
            {hits.length}件見つかりました
          </p>
          {kindOrder.map((kind) => {
            const list = hits.filter((h) => h.kind === kind)
            if (list.length === 0) return null
            return (
              <section key={kind} aria-labelledby={`search-${kind}`} className="flex flex-col gap-2">
                <h2 id={`search-${kind}`} className="text-lg font-bold">
                  {kindLabel[kind]}（{list.length}件）
                </h2>
                <ul className="flex flex-col gap-2">
                  {list.map((h) => (
                    <li key={h.id}>
                      {h.to ? (
                        <Link to={h.to} className="block rounded-xl border border-navy-100 bg-white p-3 transition-colors hover:border-brand-500">
                          <span className="text-base font-bold underline">{h.title}</span>
                          <span className="mt-0.5 block text-sm leading-relaxed text-navy-700">{h.note}</span>
                        </Link>
                      ) : (
                        <div className="rounded-xl border border-navy-100 bg-white p-3">
                          <p className="text-base font-bold">{h.title}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-navy-700">{h.note}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
