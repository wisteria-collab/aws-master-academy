import { lazy, useEffect } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { GlossaryProvider } from './components/Glossary'
import { NavigationProvider } from './components/Navigation'
import { Layout } from './components/Layout'
import { Notice } from './components/ui'
import { StorageHealthProvider } from './hooks/useStorageHealth'
import { ComingSoon } from './pages/ComingSoon'
import { Compare } from './pages/Compare'
import { CompareDetail } from './pages/CompareDetail'
import { ExamOverview } from './pages/ExamOverview'
import { Home } from './pages/Home'
import { LearnHub } from './pages/LearnHub'
import { Lesson } from './pages/Lesson'
import { Practice } from './pages/Practice'
import { Progress } from './pages/Progress'
import { Review } from './pages/Review'
import { ServiceDetail } from './pages/ServiceDetail'
import { Services } from './pages/Services'
import { useSettings } from './storage/settings'

// 最初の画面に不要なページは、開いたときに読み込む（初回表示を軽くする）
import { Search } from './pages/Search'
const ChallengePage = lazy(() => import('./pages/ChallengePage').then((m) => ({ default: m.ChallengePage })))
const Designer = lazy(() => import('./pages/Designer').then((m) => ({ default: m.Designer })))
const ExamResult = lazy(() => import('./pages/ExamResult').then((m) => ({ default: m.ExamResult })))
const Guide = lazy(() => import('./pages/Guide').then((m) => ({ default: m.Guide })))
const ExamRun = lazy(() => import('./pages/ExamRun').then((m) => ({ default: m.ExamRun })))
const DiagramEditor = lazy(() => import('./pages/DiagramEditor').then((m) => ({ default: m.DiagramEditor })))
const DiagramTemplatePage = lazy(() => import('./pages/DiagramTemplatePage').then((m) => ({ default: m.DiagramTemplatePage })))
const PracticeRun = lazy(() => import('./pages/PracticeRun').then((m) => ({ default: m.PracticeRun })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const Training = lazy(() => import('./pages/Training').then((m) => ({ default: m.Training })))

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
        <NavigationProvider>
          <GlossaryProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="learn" element={<LearnHub />} />
            <Route path="learn/:exam" element={<ExamOverview />} />
            <Route path="learn/:exam/:lessonId" element={<Lesson />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:serviceId" element={<ServiceDetail />} />
            <Route path="compare" element={<Compare />} />
            <Route path="compare/:groupId" element={<CompareDetail />} />
            <Route path="compare/:groupId/training" element={<Training />} />
            <Route path="designer" element={<Designer />} />
            <Route path="designer/templates/:templateId" element={<DiagramTemplatePage />} />
            <Route path="designer/edit/:diagramId" element={<DiagramEditor />} />
            <Route path="designer/challenges/:challengeId" element={<ChallengePage />} />
            <Route path="designer/*" element={<ComingSoon kind="designer" />} />
            <Route path="practice" element={<Practice />} />
            <Route path="practice/run" element={<PracticeRun />} />
            <Route path="exam/run/:attemptId" element={<ExamRun />} />
            <Route path="exam/result/:attemptId" element={<ExamResult />} />
            <Route path="exam/*" element={<Practice />} />
            <Route path="progress" element={<Progress />} />
            <Route path="review" element={<Review />} />
            <Route path="settings" element={<Settings />} />
            <Route path="guide" element={<Guide />} />
            <Route path="search" element={<Search />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
          </GlossaryProvider>
        </NavigationProvider>
      </HashRouter>
    </StorageHealthProvider>
  )
}
