import { Link, useNavigate, useParams } from 'react-router-dom'
import { DiagramView } from '../components/DiagramView'
import { BackLink, usePageTitle } from '../components/Navigation'
import { guideLabel } from '../components/QuestionCard'
import { SourceList } from '../components/SourceList'
import { Badge, Button, Card, EmptyState } from '../components/ui'
import { content } from '../content'
import { useSessionState } from '../hooks/useSessionState'
import { useStore } from '../hooks/useStore'
import { reviewDiagram } from '../logic/challenge'
import { newDiagramId, parseDiagram } from '../logic/diagram'
import { storage } from '../storage'

export function ChallengePage() {
  const { challengeId } = useParams()
  const challenge = content.challenges.find((c) => c.id === challengeId)
  usePageTitle(challenge?.title ?? '設計問題')
  const navigate = useNavigate()
  const saved = useStore('diagrams')
  const [showModel, setShowModel] = useSessionState('ch-model', false)

  if (!challenge) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink fallback="/designer" fallbackLabel="構成図シミュレーター" />
        <EmptyState title="この設計問題は見つかりません">一覧から選び直してください。</EmptyState>
      </div>
    )
  }

  const mine = saved.data.filter((d) => d.challengeId === challenge.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const diagram = mine ? parseDiagram(mine.nodes, mine.edges) : null
  const review = diagram && diagram.nodes.length > 0 ? reviewDiagram(challenge, diagram) : null
  const templates = (challenge.relatedTemplateIds ?? []).map((id) => content.diagrams.find((t) => t.id === id)).filter((t) => t !== undefined)

  const start = () => {
    if (mine) {
      navigate(`/designer/edit/${mine.id}`)
      return
    }
    const id = newDiagramId()
    void storage
      .put('diagrams', { id, name: `設計問題：${challenge.title}`, nodes: [], edges: [], challengeId: challenge.id, updatedAt: new Date().toISOString() })
      .then(() => navigate(`/designer/edit/${id}`))
      .catch(() => {})
  }

  return (
    <div className="flex flex-col gap-5">
      <BackLink fallback="/designer" fallbackLabel="構成図シミュレーター" />
      <header>
        <p className="text-sm text-navy-700">設計問題</p>
        <h1 className="text-2xl font-bold">{challenge.title}</h1>
      </header>

      <Card>
        <h2 className="text-lg font-bold">状況</h2>
        <p className="mt-2 text-base leading-relaxed text-navy-900">{challenge.scenario}</p>
        <h2 className="mt-4 text-lg font-bold">満たしたい要件</h2>
        <ul className="mt-2 list-disc pl-5 text-base leading-relaxed text-navy-900">
          {challenge.requirements.map((r) => (
            <li key={r} className="mt-1">
              {r}
            </li>
          ))}
        </ul>
        {challenge.hints && challenge.hints.length > 0 && (
          <details className="mt-4 rounded-xl bg-navy-50 p-3">
            <summary className="min-h-11 cursor-pointer text-base font-bold leading-[2.75rem]">ヒントを見る</summary>
            <ul className="mt-1 list-disc pl-5 text-base leading-relaxed text-navy-900">
              {challenge.hints.map((h) => (
                <li key={h} className="mt-1">
                  {h}
                </li>
              ))}
            </ul>
          </details>
        )}
        <div className="mt-4">
          <Button variant="primary" onClick={start}>
            {mine ? '自分の構成図を直す' : '構成図を作りはじめる'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">講評</h2>
        {!review || !diagram ? (
          <p className="mt-2 text-base leading-relaxed text-navy-700">構成図を作ると、ここに観点ごとの講評が表示されます。</p>
        ) : (
          <>
            <p className="mt-2 text-base leading-relaxed text-navy-900">
              {review.total}個の観点のうち、<strong>{review.passed}個</strong>を満たしています。
              {review.passed === review.total ? ' すべての観点を満たしました。模範解答と見比べて、違いを確かめましょう。' : ' 満たしていない観点の理由を読んで、構成図を直してみましょう。'}
            </p>
            <div className="mt-3 rounded-xl bg-navy-50 p-1">
              <DiagramView diagram={diagram} title="あなたの構成図" />
            </div>
            <ul className="mt-3 flex flex-col gap-2" aria-label="観点ごとの講評">
              {review.items.map((i) => (
                <li key={i.id} className={`rounded-xl border p-3 ${i.ok ? 'border-navy-100' : 'border-brand-500 bg-brand-50'}`}>
                  <p className="flex items-start gap-2 text-base font-bold">
                    <Badge tone={i.ok ? 'good' : 'brand'}>{i.ok ? '満たしている' : 'まだ'}</Badge>
                    <span>{i.label}</span>
                  </p>
                  <p className="mt-1 text-base leading-relaxed text-navy-800">{i.reason}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-navy-700">
              講評は、あらかじめ決めた観点を、機械的に確かめたものです。正しい構成は1つではありません。観点を満たしていても、要件に合わない部分が残っていることがあります。
            </p>
          </>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold">模範解答</h2>
        {showModel ? (
          <>
            <div className="mt-3 rounded-xl bg-navy-50 p-1">
              <DiagramView diagram={challenge.modelAnswer} title="模範解答の例" />
            </div>
            <p className="mt-3 text-base leading-relaxed text-navy-900">{challenge.modelExplanation}</p>
            {templates.map((t) => (
              <Link key={t.id} to={`/designer/templates/${t.id}`} className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-navy-800 px-4 text-base font-bold text-white">
                お手本構成「{t.title}」で詳しく見る
              </Link>
            ))}
            <div className="mt-3">
              <Button onClick={() => setShowModel(false)}>模範解答を隠す</Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-base leading-relaxed text-navy-700">まず自分で考えてから見ると、身につきやすくなります。</p>
            <div className="mt-3">
              <Button onClick={() => setShowModel(true)}>模範解答を見る</Button>
            </div>
          </>
        )}
      </Card>

      <SourceList sources={challenge.sources} verifiedAt={challenge.verifiedAt} uncertainNote={challenge.uncertainNote} guide={guideLabel(challenge.basedOnGuide)} />
    </div>
  )
}
