import { Link, useParams } from 'react-router-dom'
import { QuizRunner } from '../components/QuizRunner'
import { Notice, PageHeader } from '../components/ui'
import { content } from '../content'
import { useStudyTimer } from '../hooks/useStudyTimer'

/** 比較グループの選択トレーニング。条件を変えた問題を続けて出題する */
export function Training() {
  const { groupId } = useParams()
  const group = content.comparisons.find((g) => g.id === groupId)
  useStudyTimer('compare')

  if (!group) {
    return (
      <Notice tone="warn" title="比較グループが見つかりません">
        <Link to="/compare" className="underline">
          比較の一覧に戻る
        </Link>
      </Notice>
    )
  }
  const questions = group.trainingQuestionIds.map((id) => content.questions.find((q) => q.id === id)).filter((q) => q !== undefined)

  return (
    <div>
      <Link to={`/compare/${group.id}`} className="text-base font-semibold text-navy-700 underline">
        ← {group.title}
      </Link>
      <div className="mt-2">
        <PageHeader title="選択トレーニング" lead="同じサービス群で、条件を少しずつ変えた問題が続きます。どの条件で正解が変わるかに注目してください。" />
      </div>
      <QuizRunner
        questions={questions}
        mode="training"
        after={
          <div className="flex flex-wrap gap-2">
            <Link to={`/compare/${group.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-brand-500 px-4 font-bold text-navy-900">
              比較表で確認する
            </Link>
            <Link to="/compare" className="inline-flex min-h-11 items-center rounded-xl border border-navy-600 bg-white px-4 font-bold">
              比較の一覧へ
            </Link>
          </div>
        }
      />
    </div>
  )
}
