import { Link, useNavigate, useParams } from 'react-router-dom'
import { DiagramView } from '../components/DiagramView'
import { BackLink, usePageTitle } from '../components/Navigation'
import { guideLabel } from '../components/QuestionCard'
import { RichText } from '../components/RichText'
import { SourceList } from '../components/SourceList'
import { Button, Card, EmptyState } from '../components/ui'
import { content } from '../content'
import { useSessionState } from '../hooks/useSessionState'
import { newDiagramId } from '../logic/diagram'
import { storage } from '../storage'

export function DiagramTemplatePage() {
  const { templateId } = useParams()
  const template = content.diagrams.find((d) => d.id === templateId)
  usePageTitle(template?.title ?? 'お手本構成')
  const [selectedId, setSelectedId] = useSessionState<string | null>('dg-selected', null)
  const navigate = useNavigate()

  if (!template) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink fallback="/designer" fallbackLabel="構成図シミュレーター" />
        <EmptyState title="このお手本構成は見つかりません">一覧から選び直してください。</EmptyState>
      </div>
    )
  }

  const selected = template.diagram.nodes.find((n) => n.id === selectedId && n.kind !== 'group')
  const service = selected?.serviceId ? content.services.find((s) => s.id === selected.serviceId) : undefined
  const lessons = (template.relatedLessonIds ?? []).map((id) => content.lessons.find((l) => l.id === id)).filter((l) => l !== undefined)
  const serviceIds = [...new Set(template.diagram.nodes.map((n) => n.serviceId).filter((id) => id !== undefined))]
  const services = serviceIds.map((id) => content.services.find((s) => s.id === id)).filter((s) => s !== undefined)

  return (
    <div className="flex flex-col gap-5">
      <BackLink fallback="/designer" fallbackLabel="構成図シミュレーター" />
      <header>
        <p className="text-sm text-navy-700">お手本構成</p>
        <h1 className="text-2xl font-bold">{template.title}</h1>
        <p className="mt-2 text-base leading-relaxed text-navy-800">{template.summary}</p>
      </header>

      <Card>
        <h2 className="text-lg font-bold">構成図</h2>
        <p className="mt-1 text-sm text-navy-700">箱をタップすると、この構成での役割が下に表示されます。</p>
        <div className="mt-3 rounded-xl bg-navy-50 p-1">
          <DiagramView diagram={template.diagram} title={template.title} selectedId={selectedId} onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))} />
        </div>
        <div className="mt-3 rounded-xl border border-navy-100 p-4" aria-live="polite">
          {selected ? (
            <>
              <p className="text-lg font-bold">{service?.name ?? selected.label}</p>
              {selected.note && <p className="mt-1 text-base leading-relaxed text-navy-900">{selected.note}</p>}
              {service && (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-navy-700">{service.summary}</p>
                  <Link to={`/services/${service.id}`} className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-navy-600 px-4 text-base font-bold">
                    図鑑で {service.name} を見る
                  </Link>
                </>
              )}
            </>
          ) : (
            <p className="text-base text-navy-700">まだ箱が選ばれていません。図の中の箱をタップしてください。</p>
          )}
        </div>
      </Card>

      {template.flow && template.flow.length > 0 && (
        <Card>
          <h2 className="text-lg font-bold">処理の流れ</h2>
          <ol className="mt-2 list-decimal pl-6 text-base leading-relaxed text-navy-900">
            {template.flow.map((f) => (
              <li key={f} className="mt-1">
                {f}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-bold">なぜこの構成にするのか</h2>
        <div className="mt-2">
          <RichText text={template.explanation} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">試験でのポイント</h2>
        <ul className="mt-2 list-disc pl-5 text-base leading-relaxed text-navy-900">
          {template.points.map((p) => (
            <li key={p} className="mt-1">
              {p}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">使われているサービス</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {services.map((s) => (
            <li key={s.id}>
              <Link to={`/services/${s.id}`} className="block rounded-xl border border-navy-100 p-3 transition-colors hover:border-brand-500">
                <span className="text-base font-bold">{s.name}</span>
                <span className="block text-sm leading-relaxed text-navy-700">{s.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
        {lessons.length > 0 && (
          <>
            <h3 className="mt-4 text-base font-bold">関連するレッスン</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {lessons.map((l) => (
                <li key={l.id}>
                  <Link to={`/learn/${l.course}/${l.id}`} className="block rounded-xl border border-navy-100 p-3 text-base font-bold transition-colors hover:border-brand-500">
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold">この構成を自分で変えてみる</h2>
        <p className="mt-1 text-base leading-relaxed text-navy-700">お手本をコピーして、箱を足したり、つなぎ変えたりできます。お手本そのものは変わりません。</p>
        <div className="mt-3">
          <Button
            onClick={() => {
              const id = newDiagramId()
              void storage
                .put('diagrams', { id, name: `${template.title}（コピー）`, nodes: template.diagram.nodes, edges: template.diagram.edges, updatedAt: new Date().toISOString() })
                .then(() => navigate(`/designer/edit/${id}`))
                .catch(() => {})
            }}
          >
            コピーして編集する
          </Button>
        </div>
      </Card>

      <SourceList sources={template.sources} verifiedAt={template.verifiedAt} uncertainNote={template.uncertainNote} guide={guideLabel(template.basedOnGuide)} />
    </div>
  )
}
