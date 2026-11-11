import { useEffect } from 'react'
import { learningConfig } from '../config/learning'
import { addStudySeconds } from '../logic/studyTimer'
import { storage } from '../storage'

/**
 * 学習時間の計測。学習用の画面だけがこのフックを呼ぶ。
 * 画面が表示されていて、直近5分以内に操作があった時間だけを数える。
 */
export function useStudyTimer(feature: string) {
  useEffect(() => {
    let lastActivity = Date.now()
    let lastTick = Date.now()
    const touch = () => {
      lastActivity = Date.now()
    }
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }))

    const flush = (visible = document.visibilityState === 'visible') => {
      const now = Date.now()
      const elapsed = Math.round((now - lastTick) / 1000)
      lastTick = now
      const active = now - lastActivity < learningConfig.idleTimeoutSeconds * 1000
      // 端末のスリープ明けなどで間隔が極端に長いときは数えない
      if (visible && active && elapsed > 0 && elapsed <= learningConfig.studyTickSeconds * 2) {
        void addStudySeconds(storage, feature, elapsed).catch(() => {})
      }
    }
    const timer = window.setInterval(() => flush(), learningConfig.studyTickSeconds * 1000)
    const onVisibility = () => {
      // 隠れる直前までの時間は数える
      if (document.visibilityState === 'hidden') flush(true)
      else lastTick = Date.now()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      flush()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      events.forEach((e) => window.removeEventListener(e, touch))
    }
  }, [feature])
}
