import { Link } from 'react-router-dom'
import type { CourseProgress } from '../hooks/useProgressSummary'
import { isValidDate, makePlan } from '../logic/plan'
import { useSettings } from '../storage/settings'
import { Button, Card, CardTitle } from './ui'

function PlanRow({ p, today }: { p: CourseProgress; today: string }) {
  const date = useSettings((s) => s.examDates[p.exam])
  const setExamDate = useSettings((s) => s.setExamDate)
  const code = p.exam.toUpperCase()
  const plan = date && isValidDate(date) ? makePlan(today, date, p.totalLessons, p.completedLessons) : null
  const id = `exam-date-${p.exam}`

  return (
    <div className="rounded-xl border border-navy-100 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="block text-base font-bold">
            {code} の試験日
          </label>
          <input
            id={id}
            type="date"
            value={date ?? ''}
            min={today}
            onChange={(e) => setExamDate(p.exam, e.target.value || null)}
            className="mt-1 min-h-11 w-full rounded-xl border border-navy-600 bg-white px-3 text-base"
          />
        </div>
        {date && <Button onClick={() => setExamDate(p.exam, null)}>消す</Button>}
      </div>
      {plan && (
        <div className="mt-3 text-base leading-relaxed" role="status">
          {plan.state === 'past' && <p>この試験日は過ぎています。次の試験日を入れ直してください。</p>}
          {plan.state === 'today' && <p className="font-bold">今日が試験日です。落ち着いて、いつも通りに。</p>}
          {plan.state !== 'past' && plan.state !== 'today' && (
            <>
              <p>
                試験まで <span className="text-xl font-bold">あと{plan.daysLeft}日</span>・残りのレッスン {plan.remainingLessons}本
              </p>
              {plan.state === 'done' ? (
                <p className="mt-1">レッスンは学習済みです。模擬試験と、間違えた問題の復習に時間を使いましょう。</p>
              ) : (
                <p className="mt-1">
                  目安：<span className="font-bold">1週間に{plan.lessonsPerWeek}本</span>のペースで進め、最後の{plan.reviewDays}日は模擬試験と復習に使います。
                  {plan.state === 'tight' && '日数が少なめです。試験の重要度が高い分野から進めるか、試験日の変更も検討してください。'}
                </p>
              )}
              <p className="mt-2">
                <Link to={`/learn/${p.exam}`} className="font-semibold underline">
                  {code} のレッスン一覧へ
                </Link>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** 試験日から逆算した学習のペース。旅行の計画で、出発日から逆に予定を決めるのと同じ考え方 */
export function StudyPlanCard({ courses, today }: { courses: CourseProgress[]; today: string }) {
  return (
    <Card>
      <CardTitle>学習計画</CardTitle>
      <p className="mb-3 text-sm leading-relaxed text-navy-700">
        試験日を入れると、残りのレッスンから1週間のペースを計算します。数字は目安です。試験日はこの端末にだけ保存されます。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {courses.map((p) => (
          <PlanRow key={p.exam} p={p} today={today} />
        ))}
      </div>
    </Card>
  )
}
