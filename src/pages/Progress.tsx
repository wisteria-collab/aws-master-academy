import { usePageTitle } from '../components/Navigation'
import { Link } from 'react-router-dom'
import { RecordTabs } from '../components/RecordTabs'
import { Card, CardTitle, EmptyState, PageHeader, ProgressBar, Stat } from '../components/ui'
import { content, getExamSpec } from '../content'
import { useProgressSummary, type CourseProgress } from '../hooks/useProgressSummary'
import { formatDuration } from '../logic/dates'
import { accuracyBy, formatRate } from '../logic/stats'

function CourseRow({ p }: { p: CourseProgress }) {
  const spec = getExamSpec(p.exam)
  return (
    <div className="rounded-xl border border-navy-100 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-lg font-bold">{spec?.code}</p>
        <p className="text-base text-navy-700">
          {p.totalLessons > 0 ? `${p.completedLessons} / ${p.totalLessons} レッスン` : '教材準備中'}
        </p>
      </div>
      <div className="mt-2">
        <ProgressBar value={p.completedLessons} max={p.totalLessons} label={`${spec?.code}の学習進捗`} />
      </div>
      <p className="mt-2 text-base text-navy-700">
        正答率 {formatRate(p.rate)}
        {p.answered > 0 && `（${p.correct} / ${p.answered}）`}
      </p>
    </div>
  )
}

const weekday = ['日', '月', '火', '水', '木', '金', '土']

export function Progress() {
  const s = useProgressSummary()
  usePageTitle('記録')
  const max = Math.max(...s.study.week.map((d) => d.seconds), 1)

  const questionById = new Map(content.questions.map((q) => [q.id, q]))
  const byDomain = new Map(accuracyBy(s.attempts, (id) => [questionById.get(id)?.domainId ?? '']).map((g) => [g.key, g]))
  const weakServices = accuracyBy(s.attempts, (id) => questionById.get(id)?.serviceIds ?? [])
    .filter((g) => g.rate !== null && g.rate < 1)
    .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0) || b.answered - a.answered)
    .slice(0, 5)
  const examsWithQuestions = content.exams.filter((e) => content.questions.some((q) => q.exam === e.exam))

  return (
    <div>
      <PageHeader title="記録" lead="学習の記録はこの端末に保存され、ブラウザを閉じても残ります。" />
      <RecordTabs />

      <div className="flex flex-col gap-5">
        <Card>
          <CardTitle>CLF・SAAの進捗</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <CourseRow p={s.clf} />
            <CourseRow p={s.saa} />
          </div>
        </Card>

        <Card>
          <CardTitle>学習時間</CardTitle>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="今日" value={formatDuration(s.study.todaySeconds)} />
            <Stat label="累計" value={formatDuration(s.study.totalSeconds)} />
            <Stat label="学習した日" value={`${s.study.activeDays}日`} />
          </div>
          <div className="mt-4">
            <p className="text-base font-bold">直近7日間</p>
            {s.study.week.every((d) => d.seconds === 0) ? (
              <div className="mt-2">
                <EmptyState title="この7日間の記録はまだありません">
                  学習画面を開いて操作している時間だけが記録されます。
                </EmptyState>
              </div>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {s.study.week.map((d) => {
                  const [y, m, day] = d.date.split('-').map(Number)
                  const w = weekday[new Date(y, m - 1, day).getDay()]
                  return (
                    <li key={d.date} className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-2 text-base">
                      <span className="text-navy-700">
                        {m}/{day}（{w}）
                      </span>
                      <span className="h-4 overflow-hidden rounded-full bg-navy-100" aria-hidden="true">
                        <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(d.seconds / max) * 100}%` }} />
                      </span>
                      <span className="text-right font-semibold">{formatDuration(d.seconds)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>分野別の理解度</CardTitle>
          {s.attempts.length === 0 ? (
            <EmptyState title="まだ解答の記録がありません">
              問題を解くと、公式の出題分野ごとの正答率がここに表示されます。
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-navy-700">各問題の最新の解答で集計しています。</p>
              {examsWithQuestions.map((e) => (
                <div key={e.id}>
                  <p className="text-base font-bold">{e.code}</p>
                  <ul className="mt-2 flex flex-col gap-3">
                    {e.domains.map((d, i) => {
                      const g = byDomain.get(d.id)
                      return (
                        <li key={d.id}>
                          <div className="flex items-baseline justify-between gap-2 text-base">
                            <span>
                              第{i + 1}分野　{d.title}
                            </span>
                            <span className="shrink-0 font-bold">
                              {formatRate(g?.rate ?? null)}
                              {g && <span className="font-normal text-navy-700">（{g.correct}/{g.answered}）</span>}
                            </span>
                          </div>
                          <div className="mt-1">
                            <ProgressBar value={g?.correct ?? 0} max={g?.answered ?? 0} label={`${d.title}の正答率`} />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>苦手サービスランキング</CardTitle>
          {s.attempts.length === 0 ? (
            <EmptyState title="まだ解答の記録がありません">
              正答率の低いサービスから順に表示し、比較ページと復習へ案内します。
            </EmptyState>
          ) : weakServices.length === 0 ? (
            <EmptyState title="いまのところ苦手なサービスはありません">解答したサービスの問題は、すべて最新の解答で正解しています。</EmptyState>
          ) : (
            <ol className="flex flex-col gap-2">
              {weakServices.map((g, i) => {
                const service = content.services.find((x) => x.id === g.key)
                if (!service) return null
                const group = content.comparisons.find((c) => service.comparisonGroupIds.includes(c.id))
                return (
                  <li key={g.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-navy-100 p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-base font-bold text-white">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <Link to={`/services/${service.id}`} className="text-base font-bold underline">
                        {service.name}
                      </Link>
                      <span className="block text-sm text-navy-700">
                        正答率 {formatRate(g.rate)}（{g.correct}/{g.answered}）
                      </span>
                    </span>
                    {group && (
                      <Link to={`/compare/${group.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-navy-800 px-3 text-sm font-bold text-white">
                        比較で確認
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </Card>

        <Card>
          <CardTitle>模擬試験の成績推移</CardTitle>
          {s.finishedExams.length === 0 ? (
            <EmptyState title="まだ模擬試験を受けていません">
              成績はアプリ独自の正答率で表示します。本番のスケールドスコアとは異なり、合格点とは直接対応しません。
            </EmptyState>
          ) : (
            <p className="text-base">受験回数：{s.finishedExams.length}回</p>
          )}
        </Card>

        <Card>
          <CardTitle>サービスの学習状況</CardTitle>
          {s.servicesTotal === 0 ? (
            <EmptyState title="サービス図鑑を準備中です" />
          ) : (
            <p className="text-base">
              学習済み {s.servicesLearned} / {s.servicesTotal} サービス
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
