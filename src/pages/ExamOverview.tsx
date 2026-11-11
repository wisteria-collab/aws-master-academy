import { Link, useParams } from 'react-router-dom'
import { SourceList } from '../components/SourceList'
import { Card, CardTitle, EmptyState, Notice, PageHeader, Stat } from '../components/ui'
import { features } from '../config/app'
import { content, getExamSpec } from '../content'
import { examIdSchema } from '../content/schema'
import { useStudyTimer } from '../hooks/useStudyTimer'

export function ExamOverview() {
  const params = useParams()
  const parsed = examIdSchema.safeParse(params.exam)
  const exam = parsed.success ? parsed.data : undefined
  const spec = exam ? getExamSpec(exam) : undefined
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
  const phase = features[exam].phase

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={`${spec.code} コース`} lead={spec.nameJa} />

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

      <Card>
        <CardTitle>レッスン</CardTitle>
        {lessons.length === 0 ? (
          <EmptyState title="レッスンを準備中です">
            AWS公式情報と照合できたものから公開します（Phase {phase}）。
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {lessons.map((l) => (
              <li key={l.id} className="rounded-xl border border-navy-100 p-3 text-base font-semibold">
                {l.title}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SourceList sources={spec.sources} verifiedAt={spec.verifiedAt} uncertainNote={spec.uncertainNote} guide={`${spec.code} 試験ガイド Version ${spec.guideVersion}`} />
    </div>
  )
}
