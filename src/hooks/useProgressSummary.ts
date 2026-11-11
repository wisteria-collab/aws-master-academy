import { useMemo } from 'react'
import { content } from '../content'
import type { ExamId } from '../content/schema'
import { toLocalDate } from '../logic/dates'
import { dueItems } from '../logic/review'
import { accuracy, summarizeStudyTime } from '../logic/stats'
import { useStore } from './useStore'

export interface CourseProgress {
  exam: ExamId
  totalLessons: number
  completedLessons: number
  totalQuestions: number
  answered: number
  correct: number
  rate: number | null
}

/** ホームと進捗画面で使う集計。保存されている履歴と公開中の教材から計算する */
export function useProgressSummary() {
  const lessons = useStore('lessonProgress')
  const attempts = useStore('attempts')
  const sessions = useStore('studySessions')
  const reviews = useStore('reviewItems')
  const services = useStore('serviceProgress')
  const exams = useStore('examAttempts')
  const favorites = useStore('favorites')
  const diagrams = useStore('diagrams')

  const loading = [lessons, attempts, sessions, reviews, services, exams, favorites, diagrams].some((s) => s.loading)
  const today = toLocalDate(new Date())

  return useMemo(() => {
    const done = new Set(lessons.data.filter((l) => l.status === 'completed').map((l) => l.lessonId))
    const questionIds = new Set(content.questions.map((q) => q.id))
    // 教材から削除された問題の履歴は集計に含めない
    const validAttempts = attempts.data.filter((a) => questionIds.has(a.questionId))

    const course = (exam: ExamId): CourseProgress => {
      const list = content.lessons.filter((l) => l.course === exam)
      const acc = accuracy(validAttempts.filter((a) => a.exam === exam))
      return {
        exam,
        totalLessons: list.length,
        completedLessons: list.filter((l) => done.has(l.id)).length,
        totalQuestions: content.questions.filter((q) => q.exam === exam).length,
        ...acc,
      }
    }

    const serviceIds = new Set(content.services.map((s) => s.id))
    const hasAnyRecord =
      lessons.data.length + attempts.data.length + sessions.data.length + services.data.length + exams.data.length + favorites.data.length + diagrams.data.length > 0

    return {
      loading,
      today,
      clf: course('clf'),
      saa: course('saa'),
      study: summarizeStudyTime(sessions.data, today),
      dueReviews: dueItems(reviews.data, today).filter((r) => questionIds.has(r.questionId)),
      scheduledReviews: reviews.data.filter((r) => questionIds.has(r.questionId)).length,
      servicesLearned: services.data.filter((s) => s.learned && serviceIds.has(s.serviceId)).length,
      servicesTotal: content.services.length,
      finishedExams: exams.data.filter((e) => e.status === 'finished'),
      favorites: favorites.data,
      hasAnyRecord,
    }
  }, [lessons.data, attempts.data, sessions.data, reviews.data, services.data, exams.data, favorites.data, diagrams.data, loading, today])
}
