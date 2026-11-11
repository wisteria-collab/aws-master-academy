import { useCallback, useEffect, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { guideLabel } from '../components/QuestionCard'
import { QuizRunner } from '../components/QuizRunner'
import { RichText } from '../components/RichText'
import { SourceList } from '../components/SourceList'
import { Badge, Card, Notice } from '../components/ui'
import { content, getExamSpec } from '../content'
import { Figure } from '../figures'
import { useStore } from '../hooks/useStore'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { storage } from '../storage'

function Block({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-base text-brand-500">{n}</span>
        {title}
      </h2>
      {children}
    </Card>
  )
}

export function Lesson() {
  const { exam, lessonId } = useParams()
  const lesson = content.lessons.find((l) => l.id === lessonId && l.course === exam)
  const progress = useStore('lessonProgress')
  useStudyTimer('learn')

  const current = progress.data.find((p) => p.lessonId === lessonId)
  const loaded = !progress.loading

  // 初めて開いたときに「学習中」にする
  useEffect(() => {
    if (!lesson || !loaded || current) return
    void storage.put('lessonProgress', { lessonId: lesson.id, status: 'in_progress', updatedAt: new Date().toISOString() }).catch(() => {})
  }, [lesson, loaded, current])

  // 確認問題をすべて解いたら「完了」にする
  const complete = useCallback(() => {
    if (!lesson) return
    const now = new Date().toISOString()
    void storage.put('lessonProgress', { lessonId: lesson.id, status: 'completed', completedAt: now, updatedAt: now }).catch(() => {})
  }, [lesson])

  if (!lesson) {
    return (
      <Notice tone="warn" title="レッスンが見つかりません">
        <Link to="/learn" className="underline">
          「学ぶ」に戻る
        </Link>
      </Notice>
    )
  }

  const spec = getExamSpec(lesson.course)
  const domain = spec?.domains.find((d) => d.id === lesson.domainId)
  const siblings = content.lessons.filter((l) => l.course === lesson.course).sort((a, b) => a.order - b.order)
  const pos = siblings.findIndex((l) => l.id === lesson.id)
  const next = siblings[pos + 1]
  const services = lesson.relatedServiceIds.map((id) => content.services.find((s) => s.id === id)).filter((s) => s !== undefined)
  const quiz = lesson.quizQuestionIds.map((id) => content.questions.find((q) => q.id === id)).filter((q) => q !== undefined)
  const comparisons = content.comparisons.filter((c) => c.items.some((i) => i.serviceId && lesson.relatedServiceIds.includes(i.serviceId)))

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link to={`/learn/${lesson.course}`} className="text-base font-semibold text-navy-700 underline">
          ← {spec?.code} コース
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{lesson.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {domain && <Badge>{domain.title}</Badge>}
          {current?.status === 'completed' && <Badge tone="good">完了</Badge>}
        </div>
      </header>

      <Block n={1} title="概要">
        <RichText text={lesson.overview} />
      </Block>

      <Block n={2} title="かんたんに言うと">
        <div className="rounded-xl border-l-4 border-brand-500 bg-brand-50 p-3">
          <p className="text-sm font-bold text-navy-700">たとえると</p>
          <p className="mt-1 text-base leading-relaxed">{lesson.beginner.analogy}</p>
        </div>
        <RichText text={lesson.beginner.description} className="mt-3" />
      </Block>

      <Block n={3} title="具体的な利用場面">
        <ul className="list-disc pl-5 text-base leading-relaxed">
          {lesson.useCases.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </Block>

      <Block n={4} title="仕組み">
        {lesson.mechanism.figureId && (
          <div className="mb-4 rounded-xl bg-navy-50 p-1">
            <Figure id={lesson.mechanism.figureId} />
          </div>
        )}
        <RichText text={lesson.mechanism.text} />
      </Block>

      <Block n={5} title="関連するAWSサービス">
        {services.length === 0 ? (
          <p className="text-base text-navy-700">このレッスンに関連するサービスは、図鑑への追加を準備中です。</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {services.map((s) => (
              <li key={s.id}>
                <Link to={`/services/${s.id}`} className="block rounded-xl border border-navy-100 p-3 transition-colors hover:border-brand-500">
                  <span className="text-base font-bold">{s.name}</span>
                  <span className="block text-sm leading-relaxed text-navy-700">{s.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {comparisons.map((c) => (
          <Link key={c.id} to={`/compare/${c.id}`} className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-navy-800 px-4 text-base font-bold text-white">
            比べて理解する：{c.title}
          </Link>
        ))}
      </Block>

      <Block n={6} title="試験で重要なポイント">
        <ul className="flex flex-col gap-2">
          {lesson.examPoints.map((p) => (
            <li key={p} className="flex gap-2 text-base leading-relaxed">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Block>

      <section aria-labelledby="quiz-title" className="flex flex-col gap-3">
        <h2 id="quiz-title" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-base text-brand-500">7</span>
          確認問題（{quiz.length}問）
        </h2>
        <p className="text-base text-navy-700">すべて解くと、このレッスンが「完了」になります。</p>
        <QuizRunner
          questions={quiz}
          mode="lesson"
          onComplete={complete}
          after={
            <div className="flex flex-wrap gap-2">
              {next && (
                <Link to={`/learn/${lesson.course}/${next.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-brand-500 px-4 font-bold text-navy-900">
                  次のレッスン：{next.title}
                </Link>
              )}
              <Link to={`/learn/${lesson.course}`} className="inline-flex min-h-11 items-center rounded-xl border border-navy-600 bg-white px-4 font-bold">
                レッスン一覧へ
              </Link>
            </div>
          }
        />
      </section>

      <SourceList sources={lesson.sources} verifiedAt={lesson.verifiedAt} uncertainNote={lesson.uncertainNote} guide={guideLabel(lesson.basedOnGuide)} />
    </div>
  )
}
