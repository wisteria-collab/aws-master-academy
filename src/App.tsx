import { useEffect } from 'react'
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Notice } from './components/ui'
import { StorageHealthProvider } from './hooks/useStorageHealth'
import { ComingSoon } from './pages/ComingSoon'
import { ExamOverview } from './pages/ExamOverview'
import { Home } from './pages/Home'
import { LearnHub } from './pages/LearnHub'
import { Progress } from './pages/Progress'
import { Review } from './pages/Review'
import { Settings } from './pages/Settings'
import { useSettings } from './storage/settings'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <Notice tone="warn" title="ページが見つかりません">
      <Link to="/" className="underline">
        ホームに戻る
      </Link>
    </Notice>
  )
}

export default function App() {
  const fontSize = useSettings((s) => s.fontSize)
  useEffect(() => {
    document.documentElement.dataset.font = fontSize
  }, [fontSize])

  return (
    <StorageHealthProvider>
      {/* GitHub Pages では再読み込みで404にならないよう、ハッシュ方式のURLを使う */}
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="learn" element={<LearnHub />} />
            <Route path="learn/:exam" element={<ExamOverview />} />
            <Route path="services/*" element={<ComingSoon kind="services" />} />
            <Route path="compare/*" element={<ComingSoon kind="compare" />} />
            <Route path="designer/*" element={<ComingSoon kind="designer" />} />
            <Route path="practice/*" element={<ComingSoon kind="practice" />} />
            <Route path="exam/*" element={<ComingSoon kind="practice" />} />
            <Route path="progress" element={<Progress />} />
            <Route path="review" element={<Review />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </StorageHealthProvider>
  )
}
