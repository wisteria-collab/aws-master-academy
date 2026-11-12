/** 試験日から逆算する学習計画。数字は目安で、合格を保証するものではない */
export interface StudyPlan {
  /** 今日から試験日までの日数（当日は0、過ぎていれば負の数） */
  daysLeft: number
  remainingLessons: number
  /** 仕上げ（模擬試験と復習）に取っておく日数 */
  reviewDays: number
  /** レッスンに使える日数 */
  lessonDays: number
  /** 1週間あたりに進めるレッスン数の目安。残りがなければ0 */
  lessonsPerWeek: number
  state: 'past' | 'today' | 'tight' | 'ok' | 'done'
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86400000)
}

export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

export function makePlan(today: string, examDate: string, totalLessons: number, completedLessons: number): StudyPlan {
  const daysLeft = dayNumber(examDate) - dayNumber(today)
  const remainingLessons = Math.max(0, totalLessons - completedLessons)
  // 最後の1〜2週間は、新しい内容より模擬試験と復習に使う
  const reviewDays = daysLeft >= 28 ? 14 : daysLeft >= 10 ? 7 : Math.max(0, Math.floor(daysLeft / 3))
  const lessonDays = Math.max(0, daysLeft - reviewDays)
  const lessonsPerWeek = remainingLessons === 0 ? 0 : lessonDays <= 0 ? remainingLessons : Math.ceil((remainingLessons * 7) / lessonDays)
  let state: StudyPlan['state'] = 'ok'
  if (daysLeft < 0) state = 'past'
  else if (daysLeft === 0) state = 'today'
  else if (remainingLessons === 0) state = 'done'
  else if (lessonsPerWeek > 7) state = 'tight'
  return { daysLeft, remainingLessons, reviewDays, lessonDays, lessonsPerWeek: Math.min(lessonsPerWeek, remainingLessons), state }
}
