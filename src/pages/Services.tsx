import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchIcon } from '../components/icons'
import { Badge, EmptyState, PageHeader } from '../components/ui'
import { categoryLabel, importanceLabels } from '../config/labels'
import { content } from '../content'
import { useStore } from '../hooks/useStore'
import { useStudyTimer } from '../hooks/useStudyTimer'

type StatusFilter = 'all' | 'unlearned' | 'learned' | 'favorite'

export function Services() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const progress = useStore('serviceProgress')
  const favorites = useStore('favorites')
  useStudyTimer('services')

  const learned = useMemo(() => new Set(progress.data.filter((p) => p.learned).map((p) => p.serviceId)), [progress.data])
  const favs = useMemo(() => new Set(favorites.data.filter((f) => f.type === 'service').map((f) => f.refId)), [favorites.data])
  const categories = useMemo(() => [...new Set(content.services.map((s) => s.category))], [])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return content.services
      .filter((s) => category === 'all' || s.category === category)
      .filter((s) => {
        if (status === 'learned') return learned.has(s.id)
        if (status === 'unlearned') return !learned.has(s.id)
        if (status === 'favorite') return favs.has(s.id)
        return true
      })
      .filter((s) => !q || [s.name, ...s.aliases, s.summary].some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [query, category, status, learned, favs])

  const selectClass = 'min-h-11 rounded-xl border border-navy-600 bg-white px-3 text-base'

  return (
    <div>
      <PageHeader title="サービス図鑑" lead={`AWS公式情報と照合できた ${content.services.length} サービスを公開中です（学習済み ${learned.size}）。`} />

      <div className="mb-4 flex flex-col gap-2">
        <label className="relative block">
          <span className="sr-only">サービス名で検索</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-navy-600" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="サービス名で検索（例：S3、ストレージ）"
            className="min-h-12 w-full rounded-xl border border-navy-600 bg-white pr-3 pl-10 text-base"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <label>
            <span className="sr-only">カテゴリー</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
              <option value="all">すべてのカテゴリー</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">学習状態</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={selectClass}>
              <option value="all">すべての状態</option>
              <option value="unlearned">未学習</option>
              <option value="learned">学習済み</option>
              <option value="favorite">お気に入り</option>
            </select>
          </label>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title="条件に合うサービスがありません">検索語や絞り込みを変えてみてください。</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((s) => (
            <li key={s.id}>
              <Link to={`/services/${s.id}`} className="flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-4 shadow-sm transition-colors hover:border-brand-500">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold">{s.name}</span>
                  {favs.has(s.id) && <span aria-label="お気に入り" className="text-brand-600">★</span>}
                  {learned.has(s.id) && <Badge tone="good">学習済み</Badge>}
                </span>
                <span className="mt-1 text-sm text-navy-700">{categoryLabel(s.category)}</span>
                <span className="mt-2 text-base leading-relaxed">{s.summary}</span>
                <span className="mt-3 flex flex-wrap gap-2">
                  <Badge>CLF 重要度 {importanceLabels[s.importance.clf]}</Badge>
                  <Badge>SAA 重要度 {importanceLabels[s.importance.saa]}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
