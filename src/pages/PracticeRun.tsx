import { BackLink, usePageTitle } from '../components/Navigation'
import { useSessionState } from '../hooks/useSessionState'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { QuizRunner } from '../components/QuizRunner'
import { EmptyState, PageHeader } from '../components/ui'
import { content, getExamSpec } from '../content'
import type { Question } from '../content/schema'
import { shuffle } from '../logic/answers'
import { toLocalDate } from '../logic/dates'
import { pickWeak, pickWeighted } from '../logic/exam'
import { dueItems } from '../logic/review'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { storage, type Attempt } from '../storage'

type Mode = 'random' | 'domain' | 'service' | 'review' | 'weak'

/** 出題する問題を決める。画面を開いたときに1回だけ行い、解答中に並びが変わらないようにする */
async function pick(mode: Mode, params: URLSearchParams): Promise<Question[]> {
  const exam = params.get('exam')
  const pool = content.questions.filter((q) => !exam || q.exam === exam)
  if (mode === 'domain') return shuffle(pool.filter((q) => q.domainId === params.get('domain')))
  if (mode === 'service') return shuffle(pool.filter((q) => q.serviceIds.includes(params.get('service') ?? '')))
  if (mode === 'review') {
    const due = dueItems(await storage.getAll('reviewItems'), toLocalDate(new Date()))
    return due.map((r) => content.questions.find((q) => q.id === r.questionId)).filter((q) => q !== undefined)
  }
  if (mode === 'weak') return pickWeak(pool, await storage.getAll('attempts'), 10)
  // ランダム演習は、公式の出題比率に合わせて選ぶ（問題数の多い分野に偏らないようにする）
  const spec = exam === 'clf' || exam === 'saa' ? getExamSpec(exam) : undefined
  return spec ? pickWeighted(pool, spec.domains, 10) : shuffle(pool).slice(0, 10)
}

export function PracticeRun() {
  const [params] = useSearchParams()
  const raw = params.get('mode')
  const mode: Mode = raw === 'domain' || raw === 'service' || raw === 'review' || raw === 'weak' ? raw : 'random'
  // 出題した問題の並びを覚えておき、他の画面から戻ったときに同じ問題の続きから再開する
  const [ids, setIds] = useSessionState<string[] | null>('questions', null)
  const questions: Question[] | null = ids === null ? null : ids.map((id) => content.questions.find((q) => q.id === id)).filter((q) => q !== undefined)
  useStudyTimer(mode === 'review' ? 'review' : 'practice')

  const key = params.toString()
  useEffect(() => {
    if (ids !== null) return
    let alive = true
    pick(mode, new URLSearchParams(key))
      .then((q) => alive && setIds(q.map((x) => x.id)))
      .catch(() => alive && setIds([]))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, key])

  const exam = params.get('exam')
  const spec = exam === 'clf' || exam === 'saa' ? getExamSpec(exam) : undefined
  const title =
    mode === 'review'
      ? '間違えた問題の復習'
      : mode === 'domain'
        ? `分野別演習：${spec?.domains.find((d) => d.id === params.get('domain'))?.title ?? ''}`
        : mode === 'service'
          ? `サービス別演習：${content.services.find((s) => s.id === params.get('service'))?.name ?? ''}`
          : mode === 'weak'
            ? '苦手分野演習'
            : 'ランダム演習'
  const attemptMode: Attempt['mode'] = mode
  const back = mode === 'review' ? '/review' : '/practice'
  usePageTitle(title)

  return (
    <div>
      <BackLink fallback={back} fallbackLabel={mode === 'review' ? '復習' : '問題演習'} />
      <div className="mt-2">
        <PageHeader title={title} />
      </div>
      {questions === null ? (
        <p className="text-base">問題を準備しています…</p>
      ) : questions.length === 0 ? (
        <EmptyState title={mode === 'review' ? '今日が復習日の問題はありません' : mode === 'weak' ? '苦手な問題は、いまはありません' : '出題できる問題がありません'}>
          <Link to={back} className="underline">
            戻る
          </Link>
        </EmptyState>
      ) : (
        <QuizRunner
          key={key}
          questions={questions}
          mode={attemptMode}
          after={
            <Link to={back} className="inline-flex min-h-11 items-center self-start rounded-xl border border-navy-600 bg-white px-4 font-bold">
              {mode === 'review' ? '復習に戻る' : '演習メニューへ'}
            </Link>
          }
        />
      )}
    </div>
  )
}
