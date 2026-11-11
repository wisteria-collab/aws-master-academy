import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '../components/Navigation'
import { Badge, Button, Card, EmptyState, Notice } from '../components/ui'
import { content, getExamSpec } from '../content'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { recordAnswer } from '../logic/answers'
import { formatClock } from '../logic/exam'
import { storage, type ExamAttempt } from '../storage'

/** 模擬試験の解答画面。本番と同じように、採点するまで正解は表示しない */
export function ExamRun() {
  const { attemptId = '' } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState<ExamAttempt | null | undefined>(undefined)
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const latest = useRef<ExamAttempt | null>(null)
  const remainingRef = useRef(0)
  const top = useRef<HTMLDivElement>(null)
  useStudyTimer('practice')

  const spec = attempt ? getExamSpec(attempt.exam) : undefined
  usePageTitle(spec ? `${spec.code} 模擬試験` : '模擬試験')

  useEffect(() => {
    let alive = true
    storage
      .get('examAttempts', attemptId)
      .then((a) => {
        if (!alive) return
        if (a?.status === 'finished') {
          navigate(`/exam/result/${a.id}`, { replace: true })
          return
        }
        setAttempt(a ?? null)
        latest.current = a ?? null
        if (a) {
          setRemaining(a.remainingSeconds)
          remainingRef.current = a.remainingSeconds
          const firstOpen = a.questionIds.findIndex((id) => !(a.answers[id]?.length > 0))
          setIndex(firstOpen < 0 ? 0 : firstOpen)
        }
      })
      .catch(() => alive && setAttempt(null))
    return () => {
      alive = false
    }
  }, [attemptId, navigate])

  const save = useCallback((next: ExamAttempt) => {
    latest.current = next
    storage.put('examAttempts', { ...next, remainingSeconds: remainingRef.current, updatedAt: new Date().toISOString() }).catch(() => setSaveError(true))
  }, [])

  const finish = useCallback(async () => {
    const a = latest.current
    if (!a || finishing) return
    setFinishing(true)
    const now = new Date()
    const done: ExamAttempt = { ...a, status: 'finished', finishedAt: now.toISOString(), remainingSeconds: remainingRef.current, updatedAt: now.toISOString() }
    // これ以降、途中経過の自動保存で「採点済み」を上書きしないようにする
    latest.current = done
    try {
      await storage.put('examAttempts', done)
      // 解答した問題を、ふだんの演習と同じように履歴と復習予定に反映する
      for (const id of a.questionIds) {
        const selected = a.answers[id] ?? []
        const question = content.questions.find((q) => q.id === id)
        if (question && selected.length > 0) await recordAnswer(storage, { question, selected, mode: 'mock', sessionId: a.id, elapsedMs: 0, now })
      }
    } catch {
      setSaveError(true)
    }
    navigate(`/exam/result/${a.id}`, { replace: true })
  }, [finishing, navigate])

  // 時計。この画面を表示している間だけ進む。10秒ごとと、画面を離れるときに残り時間を保存する
  const ready = attempt !== undefined && attempt !== null
  useEffect(() => {
    if (!ready) return
    let last = Date.now()
    let sinceSave = 0
    const tick = () => {
      const now = Date.now()
      const passed = (now - last) / 1000
      last = now
      if (document.visibilityState !== 'visible') return
      remainingRef.current = Math.max(0, remainingRef.current - passed)
      setRemaining(remainingRef.current)
      sinceSave += passed
      if (sinceSave >= 10 && latest.current?.status === 'in_progress') {
        sinceSave = 0
        save(latest.current)
      }
      if (remainingRef.current <= 0) void finish()
    }
    const timer = window.setInterval(tick, 1000)
    const onHide = () => {
      if (document.visibilityState !== 'visible' && latest.current?.status === 'in_progress') save(latest.current)
      last = Date.now()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onHide)
      if (latest.current && latest.current.status === 'in_progress') save(latest.current)
    }
  }, [ready, save, finish])

  if (attempt === undefined) return <p className="text-base">問題を準備しています…</p>
  if (attempt === null || !spec) {
    return (
      <EmptyState title="この模擬試験は見つかりません">
        <Link to="/practice" className="underline">
          問題演習に戻る
        </Link>
      </EmptyState>
    )
  }

  const questions = attempt.questionIds.map((id) => content.questions.find((q) => q.id === id)).filter((q) => q !== undefined)
  const total = questions.length
  const question = questions[Math.min(index, total - 1)]
  const selected = attempt.answers[question.id] ?? []
  const multiple = question.select === 'multiple'
  const correctCount = question.choices.filter((c) => c.correct).length
  const answeredCount = questions.filter((q) => (attempt.answers[q.id]?.length ?? 0) > 0).length
  const flagged = attempt.flagged.includes(question.id)

  const update = (patch: Partial<ExamAttempt>) => {
    const next = { ...attempt, ...patch }
    setAttempt(next)
    save(next)
  }
  const toggle = (choiceId: string) => {
    const next = multiple ? (selected.includes(choiceId) ? selected.filter((x) => x !== choiceId) : [...selected, choiceId]) : [choiceId]
    update({ answers: { ...attempt.answers, [question.id]: next } })
  }
  const go = (i: number) => {
    setIndex(Math.min(Math.max(i, 0), total - 1))
    setConfirming(false)
    top.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <div ref={top} className="flex scroll-mt-20 flex-col gap-3">
      <div className="sticky top-14 z-10 -mx-1 flex items-center justify-between gap-2 rounded-xl border border-navy-100 bg-white px-3 py-2 shadow-sm">
        <span className="text-base font-bold">
          {spec.code} 模擬試験　{index + 1} / {total}
        </span>
        <span className={`text-lg font-bold tabular-nums ${remaining < 300 ? 'text-red-700' : ''}`} role="timer" aria-label="残り時間">
          残り {formatClock(remaining)}
        </span>
      </div>
      {saveError && <Notice tone="error" title="途中経過を保存できませんでした">この端末では学習履歴を保存できない状態です。「記録」→「設定・バックアップ」で保存の状態を確認してください。</Notice>}

      <article className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-lg leading-relaxed font-semibold text-navy-900">{question.stem}</p>
        {multiple && <p className="mt-1 text-base font-bold text-navy-700">{correctCount}つ選んでください。</p>}
        <fieldset className="mt-4 flex flex-col gap-2">
          <legend className="sr-only">選択肢</legend>
          {question.choices.map((c, i) => {
            const chosen = selected.includes(c.id)
            return (
              <label key={c.id} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${chosen ? 'border-brand-500 bg-brand-50' : 'border-navy-100 bg-white'}`}>
                <input type={multiple ? 'checkbox' : 'radio'} name={`ex-${question.id}`} checked={chosen} onChange={() => toggle(c.id)} className="mt-1 h-5 w-5 shrink-0 accent-[#c96f00]" />
                <span className="text-base leading-relaxed">
                  <span className="font-bold">{'ABCDE'[i]}. </span>
                  {c.text}
                </span>
              </label>
            )
          })}
        </fieldset>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => go(index - 1)} disabled={index === 0}>
            前の問題
          </Button>
          <Button variant={flagged ? 'primary' : 'secondary'} aria-pressed={flagged} onClick={() => update({ flagged: flagged ? attempt.flagged.filter((x) => x !== question.id) : [...attempt.flagged, question.id] })}>
            {flagged ? '見直しの印を外す' : 'あとで見直す'}
          </Button>
          {index + 1 < total && (
            <Button variant="primary" onClick={() => go(index + 1)}>
              次の問題
            </Button>
          )}
        </div>
      </article>

      <Card>
        <details open={index + 1 === total}>
          <summary className="min-h-11 cursor-pointer text-base font-bold leading-[2.75rem]">
            問題の一覧（解答済み {answeredCount} / {total}・見直し {attempt.flagged.length}）
          </summary>
          <ol className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-10" aria-label="問題の一覧">
            {questions.map((q, i) => {
              const done = (attempt.answers[q.id]?.length ?? 0) > 0
              const flag = attempt.flagged.includes(q.id)
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`${i + 1}問目：${done ? '解答済み' : '未解答'}${flag ? '・見直し' : ''}`}
                    aria-current={i === index ? 'true' : undefined}
                    className={`flex h-11 w-full items-center justify-center rounded-lg border-2 text-base font-bold ${i === index ? 'border-navy-800' : 'border-transparent'} ${flag ? 'bg-brand-100 text-navy-900' : done ? 'bg-navy-800 text-white' : 'bg-navy-50 text-navy-800'}`}
                  >
                    {i + 1}
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="mt-2 flex flex-wrap gap-2 text-sm text-navy-700">
            <Badge>濃い色：解答済み</Badge>
            <Badge tone="brand">オレンジ：見直し</Badge>
            <Badge>薄い色：未解答</Badge>
          </p>
        </details>
      </Card>

      <Card>
        {confirming ? (
          <>
            <p className="text-base font-bold">
              {answeredCount < total ? `未解答が ${total - answeredCount} 問あります（未解答は不正解として数えます）。` : 'すべての問題に解答しました。'}採点すると、解答を変えられなくなります。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => void finish()} disabled={finishing}>
                採点する
              </Button>
              <Button onClick={() => setConfirming(false)}>解答に戻る</Button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setConfirming(true)}>
              試験を終了して採点する
            </Button>
            <Link to="/practice" className="inline-flex min-h-11 items-center rounded-xl border border-navy-600 bg-white px-4 text-base font-bold">
              中断する（続きから再開できます）
            </Link>
          </div>
        )}
        <p className="mt-2 text-sm leading-relaxed text-navy-700">解答は自動で保存されます。時計は、この画面を表示している間だけ進みます（本番の試験では、時計は止まりません）。</p>
      </Card>
    </div>
  )
}
