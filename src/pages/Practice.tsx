import { toLocalDate } from '../logic/dates'
import { usePageTitle } from '../components/Navigation'
import { useSessionState } from '../hooks/useSessionState'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronIcon } from '../components/icons'
import { Badge, Button, Card, CardTitle, EmptyState, PageHeader } from '../components/ui'
import { content, getExamSpec } from '../content'
import type { ExamId } from '../content/schema'
import { useProgressSummary } from '../hooks/useProgressSummary'
import { useStore } from '../hooks/useStore'
import { newId } from '../logic/answers'
import { formatClock, MOCK_QUESTION_COUNT, pickWeak, pickWeighted, scoreExam, similarKey } from '../logic/exam'
import { formatRate } from '../logic/stats'
import { storage } from '../storage'

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
  return disabled ? (
    <div className={`${cls} bg-navy-50 text-navy-700`} aria-disabled="true">
      {inner}
    </div>
  ) : <Link to={to} className={`${cls} transition-colors hover:border-brand-500`}>{inner}</Link>
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
  const navigate = useNavigate()
  const exams = useStore('examAttempts')
  const running = exams.data.filter((e) => e.exam === exam && e.status === 'in_progress').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const finished = exams.data.filter((e) => e.exam === exam && e.status === 'finished').sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
  const weakCount = pickWeak(questions, summary.attempts, 10).length
  const canMock = spec !== undefined && questions.length >= MOCK_QUESTION_COUNT

  const startMock = async () => {
    if (!spec) return
    // 途中の模擬試験は1つだけにする（新しく始めるときは、前のものを破棄する）
    for (const e of exams.data.filter((x) => x.exam === exam && x.status === 'in_progress')) await storage.remove('examAttempts', e.id).catch(() => {})
    const now = new Date().toISOString()
    const id = newId()
    const picked = pickWeighted(questions, spec.domains, MOCK_QUESTION_COUNT, Math.random, similarKey)
    await storage
      .put('examAttempts', { id, exam, questionIds: picked.map((q) => q.id), answers: {}, flagged: [], startedAt: now, remainingSeconds: spec.durationMinutes * 60, status: 'in_progress', updatedAt: now })
      .then(() => navigate(`/exam/run/${id}`))
      .catch(() => {})
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="問題演習" lead="解答すると、正解の理由と、他の選択肢がなぜ不適切かを表示します。模擬試験は、採点のあとにまとめて表示します。" />

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
              <Row to={`/practice/run?exam=${exam}&mode=random`} title="ランダム演習" note="公式の出題比率に合わせて、全分野から最大10問" count={Math.min(10, questions.length)} />
              <Row
                to={`/practice/run?exam=${exam}&mode=weak`}
                title="苦手分野演習"
                note={weakCount > 0 ? '間違えた問題と、正答率の低い分野から最大10問' : '解答の履歴がたまると使えます（間違えた問題があるときに出題します）'}
                count={weakCount}
              />
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

      {questions.length > 0 && spec && (
        <Card>
          <CardTitle>模擬試験</CardTitle>
          <p className="text-base leading-relaxed text-navy-800">
            本番と同じ {MOCK_QUESTION_COUNT}問・{spec.durationMinutes}分です。公式の出題比率に合わせて出題し、採点するまで正解は表示しません。
          </p>
          <p className="mt-1 text-sm leading-relaxed text-navy-700">
            成績は、アプリ独自の正答率と、分野別の正答率で表示します。本番のスケールドスコア（{spec.scoreMin}〜{spec.scoreMax}点）や合格点（{spec.passingScore}点）とは、直接対応しません。
          </p>
          {!canMock ? (
            <p className="mt-3 text-base font-bold">検証済みの問題が {MOCK_QUESTION_COUNT}問そろうまで、公開しません（現在 {questions.length}問）。</p>
          ) : running ? (
            <div className="mt-3 rounded-xl bg-navy-50 p-3">
              <p className="text-base font-bold">
                途中の模擬試験があります（解答済み {Object.values(running.answers).filter((a) => a.length > 0).length} / {running.questionIds.length}・残り {formatClock(running.remainingSeconds)}）
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link to={`/exam/run/${running.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-brand-500 px-4 text-base font-bold text-navy-900">
                  続きから再開する
                </Link>
                <Button onClick={() => void startMock()}>破棄して、新しく始める</Button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <Button variant="primary" onClick={() => void startMock()}>
                {spec.code} の模擬試験を始める
              </Button>
            </div>
          )}
          {finished.length > 0 && (
            <>
              <h3 className="mt-4 text-base font-bold">これまでの結果</h3>
              <ul className="mt-2 flex flex-col gap-2" aria-label="模擬試験の結果">
                {finished.slice(0, 5).map((e) => {
                  const sc = scoreExam(e, questions, spec.domains.map((d) => d.id))
                  return (
                    <li key={e.id}>
                      <Link to={`/exam/result/${e.id}`} className="flex min-h-12 items-center gap-3 rounded-xl border border-navy-100 p-3 transition-colors hover:border-brand-500">
                        <span className="min-w-0 flex-1 text-base">
                          <span className="font-bold">{toLocalDate(new Date(e.finishedAt ?? e.updatedAt)).replaceAll('-', '/')}</span>
                          <span className="ml-2 text-navy-700">
                            {sc.total}問中 {sc.correct}問正解
                          </span>
                        </span>
                        <Badge tone="good">正答率 {formatRate(sc.rate)}</Badge>
                        <ChevronIcon className="h-5 w-5 shrink-0 text-navy-600" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
