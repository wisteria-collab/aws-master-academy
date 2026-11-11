import { Link, useParams } from 'react-router-dom'
import { ChevronIcon } from '../components/icons'
import { SourceList } from '../components/SourceList'
import { Badge, Card, CardTitle, EmptyState, Notice, PageHeader, ProgressBar, Stat } from '../components/ui'
import { features } from '../config/app'
import { plannedLessons } from '../config/labels'
import { content, getExamSpec } from '../content'
import { examIdSchema } from '../content/schema'
import { useStore } from '../hooks/useStore'
import { useStudyTimer } from '../hooks/useStudyTimer'

/** コースのトップ：レッスン一覧と、試験の概要 */
export function ExamOverview() {
  const params = useParams()
  const parsed = examIdSchema.safeParse(params.exam)
  const exam = parsed.success ? parsed.data : undefined
  const spec = exam ? getExamSpec(exam) : undefined
  const progress = useStore('lessonProgress')
  useStudyTimer('learn')

  if (!exam || !spec) {
    return (
      <Notice tone="warn" title="コースが見つかりません">
        <Link to="/learn" className="underline">
          「学ぶ」に戻る
        </Link>
      </Notice>
    )
  }

  const lessons = content.lessons.filter((l) => l.course === exam).sort((a, b) => a.order - b.order)
  const status = new Map(progress.data.map((p) => [p.lessonId, p.status]))
  const done = lessons.filter((l) => status.get(l.id) === 'completed').length
  const domainTitle = (id: string) => spec.domains.find((d) => d.id === id)?.title ?? ''

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={`${spec.code} コース`} lead={spec.nameJa} />

      <Card>
        <CardTitle aside={lessons.length > 0 ? <span className="text-base font-semibold text-navy-700">{done} / {lessons.length} 完了</span> : undefined}>
          レッスン
        </CardTitle>
        {lessons.length === 0 ? (
          <EmptyState title="レッスンを準備中です">AWS公式情報と照合できたものから公開します（Phase {features[exam].phase}）。</EmptyState>
        ) : (
          <>
            <ProgressBar value={done} max={lessons.length} label={`${spec.code}のレッスン進捗`} />
            <p className="mt-2 text-sm text-navy-700">
              公開中 {lessons.length} テーマ（予定 {plannedLessons[exam]} テーマ）。AWS公式情報と照合できたものから順に追加します。
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {lessons.map((l) => {
                const st = status.get(l.id)
                return (
                  <li key={l.id}>
                    <Link
                      to={`/learn/${exam}/${l.id}`}
                      className="flex min-h-16 items-center gap-3 rounded-xl border border-navy-100 p-3 transition-colors hover:border-brand-500"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${st === 'completed' ? 'bg-emerald-600 text-white' : 'bg-navy-100 text-navy-800'}`}
                        aria-hidden="true"
                      >
                        {st === 'completed' ? '✓' : l.order}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-bold">{l.title}</span>
                        <span className="block text-sm text-navy-700">{domainTitle(l.domainId)}</span>
                      </span>
                      {st === 'completed' ? <Badge tone="good">完了</Badge> : st === 'in_progress' ? <Badge tone="brand">学習中</Badge> : <Badge>未学習</Badge>}
                      <ChevronIcon className="h-5 w-5 shrink-0 text-navy-600" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <CardTitle>試験の概要</CardTitle>
        <p className="mb-3 text-base text-navy-700">
          公式試験ガイド Version {spec.guideVersion}（{spec.guideDate.replaceAll('-', '/')} 発行）に基づいています。
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="問題数" value={`${spec.questionCount}問`} note={`採点対象 ${spec.scoredCount}問`} />
          <Stat label="試験時間" value={`${spec.durationMinutes}分`} />
          <Stat label="合格点" value={`${spec.passingScore}`} note={`${spec.scoreMin}〜${spec.scoreMax}点中`} />
          <Stat label="分野" value={`${spec.domains.length}分野`} />
        </div>
        <ul className="mt-3 list-disc pl-5 text-base leading-relaxed text-navy-800">
          {spec.questionTypes.map((t) => (
            <li key={t}>{t}</li>
          ))}
          {spec.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>出題分野と比率</CardTitle>
        <ol className="flex flex-col gap-4">
          {spec.domains.map((d, i) => (
            <li key={d.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base font-bold">
                  第{i + 1}分野　{d.title}
                </p>
                <p className="shrink-0 text-lg font-bold">{d.weight}%</p>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-navy-100" aria-hidden="true">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${d.weight}%` }} />
              </div>
              <ul className="mt-2 list-disc pl-5 text-base leading-relaxed text-navy-800">
                {d.tasks.map((t) => (
                  <li key={t.id}>{t.title}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Card>

      <SourceList sources={spec.sources} verifiedAt={spec.verifiedAt} uncertainNote={spec.uncertainNote} guide={`${spec.code} 試験ガイド Version ${spec.guideVersion}`} />
    </div>
  )
}
