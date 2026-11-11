import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Question } from '../content/schema'
import { newId, recordAnswer } from '../logic/answers'
import { storage, type Attempt } from '../storage'
import { QuestionCard, type AnswerResult } from './QuestionCard'
import { Button, Notice } from './ui'

interface Props {
  questions: Question[]
  mode: Attempt['mode']
  /** 全問解き終えたときに1回だけ呼ばれる */
  onComplete?: (summary: { total: number; correct: number }) => void
  /** 結果画面の下に表示するリンクなど */
  after?: ReactNode
}

/** 問題を1問ずつ出題し、解答を記録して、最後に結果を表示する */
export function QuizRunner({ questions, mode, onComplete, after }: Props) {
  const [round, setRound] = useState(0)
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [saveError, setSaveError] = useState(false)
  const sessionId = useRef(newId())
  const completed = useRef(false)
  const top = useRef<HTMLDivElement>(null)

  const answered = results.length > index
  const finished = index >= questions.length

  useEffect(() => {
    if (finished && !completed.current && questions.length > 0) {
      completed.current = true
      onComplete?.({ total: questions.length, correct: results.filter(Boolean).length })
    }
  }, [finished, onComplete, questions.length, results])

  const handleAnswer = (question: Question, r: AnswerResult) => {
    setResults((cur) => [...cur, r.correct])
    recordAnswer(storage, { question, selected: r.selected, mode, sessionId: sessionId.current, elapsedMs: r.elapsedMs }).catch(() =>
      setSaveError(true),
    )
  }

  const next = () => {
    setIndex((i) => i + 1)
    top.current?.scrollIntoView({ block: 'start' })
  }

  const restart = () => {
    sessionId.current = newId()
    completed.current = false
    setResults([])
    setIndex(0)
    setRound((r) => r + 1)
  }

  if (questions.length === 0) return null

  if (finished) {
    const correct = results.filter(Boolean).length
    return (
      <div ref={top} className="flex scroll-mt-20 flex-col gap-3">
        <div className="rounded-2xl border border-navy-100 bg-white p-5 text-center shadow-sm">
          <p className="text-base text-navy-700">結果</p>
          <p className="mt-1 text-3xl font-bold">
            {correct} / {questions.length} 問正解
          </p>
          <p className="mt-2 text-base leading-relaxed text-navy-700">
            {correct === questions.length
              ? 'すべて正解です。'
              : '間違えた問題は、復習リストに追加されました。翌日以降にもう一度出題されます。'}
          </p>
          <ol className="mt-3 flex flex-wrap justify-center gap-2">
            {results.map((ok, i) => (
              <li
                key={i}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-bold ${ok ? 'bg-emerald-100 text-emerald-950' : 'bg-red-100 text-red-950'}`}
                aria-label={`${i + 1}問目：${ok ? '正解' : '不正解'}`}
              >
                {ok ? '○' : '×'}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={restart}>もう一度解く</Button>
          </div>
        </div>
        {saveError && <Notice tone="error" title="解答を保存できませんでした">この端末では学習履歴を保存できない状態です。「記録」→「設定・バックアップ」で保存の状態を確認してください。</Notice>}
        {after}
      </div>
    )
  }

  const question = questions[index]
  return (
    <div ref={top} className="flex scroll-mt-20 flex-col gap-3">
      <QuestionCard
        key={`${round}-${question.id}`}
        question={question}
        number={`${index + 1} / ${questions.length}`}
        onAnswer={(r) => handleAnswer(question, r)}
        footer={
          answered ? (
            <Button variant="primary" onClick={next} className="w-full sm:w-auto">
              {index + 1 === questions.length ? '結果を見る' : '次の問題へ'}
            </Button>
          ) : null
        }
      />
    </div>
  )
}
