import { toLocalDate } from '../logic/dates'
import { Link, useParams } from 'react-router-dom'
import { BackLink, usePageTitle } from '../components/Navigation'
import { QuestionCard } from '../components/QuestionCard'
import { Button, Card, EmptyState, Notice, ProgressBar } from '../components/ui'
import { content, getExamSpec } from '../content'
import { useSessionState } from '../hooks/useSessionState'
import { useStore } from '../hooks/useStore'
import { formatClock, scoreExam } from '../logic/exam'
import { formatRate } from '../logic/stats'

type Filter = 'wrong' | 'all'

export function ExamResult() {
  const { attemptId } = useParams()
  const exams = useStore('examAttempts')
  const attempt = exams.data.find((e) => e.id === attemptId)
  const spec = attempt ? getExamSpec(attempt.exam) : undefined
  usePageTitle(spec ? `${spec.code} 模擬試験の結果` : '模擬試験の結果')
  const [filter, setFilter] = useSessionState<Filter>('ex-filter', 'wrong')
  const [open, setOpen] = useSessionState<string | null>('ex-open', null)

  if (exams.loading) return <p className="text-base">読み込み中…</p>
  if (!attempt || !spec || attempt.status !== 'finished') {
    return (
      <div className="flex flex-col gap-4">
        <BackLink fallback="/practice" fallbackLabel="問題演習" />
        <EmptyState title="この模擬試験の結果は見つかりません">
          <Link to="/practice" className="underline">
            問題演習に戻る
          </Link>
        </EmptyState>
      </div>
    )
  }

  const questions = content.questions.filter((q) => q.exam === attempt.exam)
  const score = scoreExam(attempt, questions, spec.domains.map((d) => d.id))
  const used = spec.durationMinutes * 60 - attempt.remainingSeconds
  const weakest = [...score.domains].filter((d) => d.rate !== null).sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0))[0]
  const weakestSpec = spec.domains.find((d) => d.id === weakest?.domainId)
  const shown = score.items.map((item, i) => ({ item, n: i + 1 })).filter(({ item }) => filter === 'all' || !item.correct)

  return (
    <div className="flex flex-col gap-5">
      <BackLink fallback="/practice" fallbackLabel="問題演習" />
      <header>
        <p className="text-sm text-navy-700">
          {spec.code} 模擬試験・{toLocalDate(new Date(attempt.finishedAt ?? attempt.updatedAt)).replaceAll('-', '/')}
        </p>
        <h1 className="text-2xl font-bold">模擬試験の結果</h1>
      </header>

      <Card>
        <p className="text-base text-navy-700">正答率（アプリ独自）</p>
        <p className="mt-1 text-4xl font-bold">{formatRate(score.rate)}</p>
        <p className="mt-1 text-base text-navy-800">
          {score.total}問中 {score.correct}問正解{score.unanswered > 0 ? `（未解答 ${score.unanswered}問）` : ''}・かかった時間 {formatClock(used)}（制限 {spec.durationMinutes}分）
        </p>
      </Card>

      <Notice tone="info" title="この正答率は、本番の点数ではありません">
        本番の試験は、{spec.scoreMin}〜{spec.scoreMax}点のスケールドスコアで採点され、合格点は{spec.passingScore}点です。また、65問のうち{spec.unscoredCount}問は採点されない問題です。この画面の正答率はアプリ独自の計算で、本番のスコアや合格点とは直接対応しません。弱い分野を見つける目安として使ってください。
      </Notice>

      <Card>
        <h2 className="text-lg font-bold">分野別の正答率</h2>
        <ul className="mt-3 flex flex-col gap-4">
          {score.domains.map((d, i) => {
            const ds = spec.domains.find((x) => x.id === d.domainId)
            return (
              <li key={d.domainId}>
                <p className="text-base font-bold">
                  第{i + 1}分野　{ds?.title}
                </p>
                <p className="text-sm text-navy-700">
                  出題比率 {ds?.weight}%・{d.total}問中 {d.correct}問正解（{formatRate(d.rate)}）
                </p>
                <div className="mt-1">
                  <ProgressBar value={d.correct} max={Math.max(d.total, 1)} label={`${ds?.title}の正答率`} />
                </div>
              </li>
            )
          })}
        </ul>
        {weakestSpec && weakest && (weakest.rate ?? 1) < 1 && (
          <div className="mt-4 rounded-xl bg-navy-50 p-3">
            <p className="text-base leading-relaxed">
              いちばん正答率が低かったのは「<strong>{weakestSpec.title}</strong>」です。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link to={`/practice/run?exam=${attempt.exam}&mode=domain&domain=${weakestSpec.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-navy-800 px-4 text-base font-bold text-white">
                この分野を演習する
              </Link>
              <Link to={`/practice/run?exam=${attempt.exam}&mode=weak`} className="inline-flex min-h-11 items-center rounded-xl border border-navy-600 bg-white px-4 text-base font-bold">
                苦手分野演習へ
              </Link>
            </div>
          </div>
        )}
      </Card>

      <section aria-labelledby="ex-review">
        <h2 id="ex-review" className="text-xl font-bold">
          問題の振り返り
        </h2>
        <div className="mt-2 flex gap-2" role="group" aria-label="表示する問題">
          <Button variant={filter === 'wrong' ? 'primary' : 'secondary'} aria-pressed={filter === 'wrong'} onClick={() => setFilter('wrong')}>
            間違えた問題（{score.total - score.correct}）
          </Button>
          <Button variant={filter === 'all' ? 'primary' : 'secondary'} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            すべて（{score.total}）
          </Button>
        </div>
        {shown.length === 0 ? (
          <p className="mt-3 text-base">間違えた問題はありません。</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2">
            {shown.map(({ item, n }) => {
              const q = questions.find((x) => x.id === item.questionId)
              if (!q) return null
              const isOpen = open === q.id
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : q.id)}
                    className="flex min-h-12 w-full items-start gap-3 rounded-xl border border-navy-100 bg-white p-3 text-left"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold ${item.correct ? 'bg-emerald-100 text-emerald-950' : 'bg-red-100 text-red-950'}`}>
                      {item.correct ? '○' : item.answered ? '×' : '−'}
                    </span>
                    <span className="min-w-0 flex-1 text-base leading-relaxed">
                      <span className="font-bold">
                        {n}問目{item.answered ? '' : '（未解答）'}
                      </span>
                      <span className="block text-navy-800">{isOpen ? '解説を閉じる' : `${q.stem.slice(0, 44)}…`}</span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="mt-2">
                      <QuestionCard question={q} number={`${n}問目`} initial={{ selected: item.selected, submitted: true }} onAnswer={() => {}} />
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <Link to="/practice" className="inline-flex min-h-11 items-center self-start rounded-xl border border-navy-600 bg-white px-4 font-bold">
        演習メニューへ
      </Link>
    </div>
  )
}
