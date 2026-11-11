import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { difficultyLabels, formatLabels } from '../config/labels'
import { content } from '../content'
import type { Question } from '../content/schema'
import { grade } from '../logic/answers'
import { SourceList } from './SourceList'
import { Badge, Button } from './ui'

export interface AnswerResult {
  selected: string[]
  correct: boolean
  elapsedMs: number
}

/** 問題文の中の、判断材料になる語句を強調する */
function highlight(stem: string, keywords: string[]): ReactNode[] {
  const hits = keywords
    .map((k) => ({ k, i: stem.indexOf(k) }))
    .filter((h) => h.i >= 0)
    .sort((a, b) => a.i - b.i)
  const out: ReactNode[] = []
  let pos = 0
  hits.forEach((h, n) => {
    if (h.i < pos) return
    if (h.i > pos) out.push(stem.slice(pos, h.i))
    out.push(
      <mark key={n} className="rounded bg-brand-100 px-0.5 font-bold text-navy-900">
        {h.k}
      </mark>,
    )
    pos = h.i + h.k.length
  })
  if (pos < stem.length) out.push(stem.slice(pos))
  return out
}

const relatedPath = { lesson: (id: string, exam: string) => `/learn/${exam}/${id}`, service: (id: string) => `/services/${id}`, comparison: (id: string) => `/compare/${id}` }

function relatedTitle(type: 'lesson' | 'service' | 'comparison', id: string): string | undefined {
  if (type === 'lesson') return content.lessons.find((l) => l.id === id)?.title
  if (type === 'service') return content.services.find((s) => s.id === id)?.name
  return content.comparisons.find((c) => c.id === id)?.title
}

interface Props {
  question: Question
  number?: string
  onAnswer: (result: AnswerResult) => void
  /** 解説の下に表示する「次へ」などのボタン */
  footer?: ReactNode
}

export function QuestionCard({ question, number, onAnswer, footer }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const startedAt = useRef(Date.now())
  const multiple = question.select === 'multiple'
  const correctCount = question.choices.filter((c) => c.correct).length
  const isCorrect = useMemo(() => grade(question, selected), [question, selected])

  const toggle = (id: string) => {
    if (submitted) return
    setSelected((cur) => (multiple ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id]))
  }

  const submit = () => {
    setSubmitted(true)
    onAnswer({ selected, correct: grade(question, selected), elapsedMs: Date.now() - startedAt.current })
  }

  const canSubmit = multiple ? selected.length === correctCount : selected.length === 1
  const services = question.serviceIds.map((id) => content.services.find((s) => s.id === id)).filter((s) => s !== undefined)

  return (
    <article className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {number && <span className="text-base font-bold text-navy-700">{number}</span>}
        <Badge>{formatLabels[question.format]}</Badge>
        <Badge>難易度：{difficultyLabels[question.difficulty]}</Badge>
      </div>
      <p className="text-lg leading-relaxed font-semibold text-navy-900">
        {submitted ? highlight(question.stem, question.keywords) : question.stem}
      </p>
      {multiple && <p className="mt-1 text-base font-bold text-navy-700">{correctCount}つ選んでください。</p>}

      <fieldset className="mt-4 flex flex-col gap-2" disabled={submitted}>
        <legend className="sr-only">選択肢</legend>
        {question.choices.map((c, i) => {
          const chosen = selected.includes(c.id)
          const state = !submitted ? (chosen ? 'chosen' : 'idle') : c.correct ? 'correct' : chosen ? 'wrong' : 'other'
          const styles = {
            idle: 'border-navy-100 bg-white',
            chosen: 'border-brand-500 bg-brand-50',
            correct: 'border-emerald-600 bg-emerald-50',
            wrong: 'border-red-600 bg-red-50',
            other: 'border-navy-100 bg-white',
          }[state]
          return (
            <div key={c.id} className={`rounded-xl border-2 ${styles}`}>
              <label className={`flex min-h-12 items-start gap-3 p-3 ${submitted ? '' : 'cursor-pointer'}`}>
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name={`q-${question.id}`}
                  checked={chosen}
                  onChange={() => toggle(c.id)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#c96f00]"
                />
                <span className="text-base leading-relaxed">
                  <span className="font-bold">{'ABCDE'[i]}. </span>
                  {c.text}
                </span>
              </label>
              {submitted && (
                <div className="border-t border-navy-100 px-3 py-2 text-base leading-relaxed">
                  <p className="font-bold">
                    {c.correct ? '○ 正解' : '× 不正解'}
                    {chosen && '（あなたの解答）'}
                  </p>
                  <p className="mt-0.5">{c.explanation}</p>
                  {!c.correct && c.eliminatedBy && (
                    <p className="mt-1 text-sm text-navy-700">この選択肢を外す根拠になる条件：「{c.eliminatedBy}」</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </fieldset>

      {!submitted ? (
        <div className="mt-4">
          <Button variant="primary" onClick={submit} disabled={!canSubmit} className="w-full sm:w-auto">
            解答する
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3" aria-live="polite">
          <div
            role="status"
            className={`rounded-xl p-3 text-lg font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-950' : 'bg-red-100 text-red-950'}`}
          >
            {isCorrect ? '正解です' : '不正解です'}
          </div>
          <div className="rounded-xl bg-navy-50 p-3 text-base leading-relaxed">
            <p className="font-bold">判断のポイント</p>
            <p>{question.decisionPoint}</p>
            <p className="mt-2 font-bold">問題文の重要なキーワード</p>
            <p>{question.keywords.map((k) => `「${k}」`).join(' ')}</p>
            {question.practicalNote && (
              <>
                <p className="mt-2 font-bold">実務での利用場面</p>
                <p>{question.practicalNote}</p>
              </>
            )}
          </div>
          {(services.length > 0 || question.related.length > 0) && (
            <div className="text-base">
              <p className="font-bold">関連するサービス・教材</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {services.map((s) => (
                  <li key={s.id}>
                    <Link to={`/services/${s.id}`} className="inline-flex min-h-11 items-center rounded-full border border-navy-600 px-3 font-semibold">
                      {s.name}
                    </Link>
                  </li>
                ))}
                {question.related
                  .filter((r) => r.type !== 'service')
                  .map((r) => {
                    const title = relatedTitle(r.type, r.id)
                    if (!title) return null
                    const to = r.type === 'lesson' ? relatedPath.lesson(r.id, question.exam) : relatedPath.comparison(r.id)
                    return (
                      <li key={`${r.type}-${r.id}`}>
                        <Link to={to} className="inline-flex min-h-11 items-center rounded-full bg-navy-800 px-3 font-semibold text-white">
                          {r.type === 'lesson' ? 'レッスン' : '比較'}：{title}
                        </Link>
                      </li>
                    )
                  })}
              </ul>
            </div>
          )}
          <SourceList sources={question.sources} verifiedAt={question.verifiedAt} uncertainNote={question.uncertainNote} guide={guideLabel(question.basedOnGuide)} />
          {footer}
        </div>
      )}
    </article>
  )
}

export function guideLabel(based: { exam: string; version: string }[] | undefined): string | undefined {
  if (!based || based.length === 0) return undefined
  return based
    .map((g) => `${content.exams.find((e) => e.exam === g.exam)?.code ?? g.exam.toUpperCase()} 試験ガイド Version ${g.version}`)
    .join('、')
}
