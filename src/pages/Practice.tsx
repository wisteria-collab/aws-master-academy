import { usePageTitle } from '../components/Navigation'
import { useSessionState } from '../hooks/useSessionState'
import { Link } from 'react-router-dom'
import { ChevronIcon } from '../components/icons'
import { Badge, Button, Card, CardTitle, EmptyState, PageHeader } from '../components/ui'
import { content, getExamSpec } from '../content'
import type { ExamId } from '../content/schema'
import { useProgressSummary } from '../hooks/useProgressSummary'

function Row({ to, title, note, count }: { to: string; title: string; note?: string; count: number }) {
  const disabled = count === 0
  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold">{title}</span>
        {note && <span className="block text-sm text-navy-700">{note}</span>}
      </span>
      <Badge>{count}問</Badge>
      <ChevronIcon className="h-5 w-5 shrink-0 text-navy-600" />
    </>
  )
  const cls = 'flex min-h-14 items-center gap-3 rounded-xl border border-navy-100 p-3'
  return disabled ? <div className={`${cls} opacity-50`}>{inner}</div> : <Link to={to} className={`${cls} transition-colors hover:border-brand-500`}>{inner}</Link>
}

export function Practice() {
  const [exam, setExam] = useSessionState<ExamId>('exam', 'clf')
  usePageTitle('問題演習')
  const summary = useProgressSummary()
  const spec = getExamSpec(exam)
  const questions = content.questions.filter((q) => q.exam === exam)
  const services = content.services
    .map((s) => ({ s, n: questions.filter((q) => q.serviceIds.includes(s.id)).length }))
    .filter((x) => x.n > 0)
  const due = summary.dueReviews.length

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="問題演習" lead="解答すると、正解の理由と、他の選択肢がなぜ不適切かを表示します。" />

      <div className="flex gap-2" role="group" aria-label="試験の選択">
        {(['clf', 'saa'] as const).map((e) => (
          <Button key={e} variant={exam === e ? 'primary' : 'secondary'} aria-pressed={exam === e} onClick={() => setExam(e)} className="flex-1">
            {getExamSpec(e)?.code}
          </Button>
        ))}
      </div>

      {questions.length === 0 ? (
        <EmptyState title={`${spec?.code} の問題は準備中です`}>AWS公式情報と照合できたものから公開します。</EmptyState>
      ) : (
        <>
          <p className="text-base text-navy-700">
            公開中 {questions.length} 問。照合できた問題から順に追加しています。
          </p>

          <Card>
            <CardTitle>まとめて解く</CardTitle>
            <div className="flex flex-col gap-2">
              <Row to={`/practice/run?exam=${exam}&mode=random`} title="ランダム演習" note="全分野からランダムに最大10問" count={Math.min(10, questions.length)} />
              <Row to="/practice/run?mode=review" title="間違えた問題の復習" note={due > 0 ? '今日が復習日の問題' : '今日が復習日の問題はありません'} count={due} />
            </div>
          </Card>

          <Card>
            <CardTitle>分野別演習</CardTitle>
            <div className="flex flex-col gap-2">
              {spec?.domains.map((d, i) => (
                <Row
                  key={d.id}
                  to={`/practice/run?exam=${exam}&mode=domain&domain=${d.id}`}
                  title={`第${i + 1}分野　${d.title}`}
                  note={`出題比率 ${d.weight}%`}
                  count={questions.filter((q) => q.domainId === d.id).length}
                />
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>サービス別演習</CardTitle>
            <div className="flex flex-col gap-2">
              {services.map(({ s, n }) => (
                <Row key={s.id} to={`/practice/run?exam=${exam}&mode=service&service=${s.id}`} title={s.name} count={n} />
              ))}
            </div>
          </Card>
        </>
      )}

      <Card>
        <CardTitle>準備中のモード（Phase 6）</CardTitle>
        <ul className="list-disc pl-5 text-base leading-relaxed">
          <li>苦手分野演習：正答率の低い分野・サービスから出題します。</li>
          <li>
            模擬試験：65問（CLF 90分・SAA 130分）。検証済みの問題が65問そろうまでは公開しません。採点はアプリ独自の正答率で表示し、本番のスケールドスコアとは異なります。
          </li>
        </ul>
      </Card>
    </div>
  )
}
