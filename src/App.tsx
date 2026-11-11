import { useEffect } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { GlossaryProvider } from './components/Glossary'
import { NavigationProvider } from './components/Navigation'
import { Layout } from './components/Layout'
import { Notice } from './components/ui'
import { StorageHealthProvider } from './hooks/useStorageHealth'
import { ChallengePage } from './pages/ChallengePage'
import { ComingSoon } from './pages/ComingSoon'
import { Designer } from './pages/Designer'
import { ExamResult } from './pages/ExamResult'
import { Guide } from './pages/Guide'
import { ExamRun } from './pages/ExamRun'
import { DiagramEditor } from './pages/DiagramEditor'
import { DiagramTemplatePage } from './pages/DiagramTemplatePage'
import { Compare } from './pages/Compare'
import { CompareDetail } from './pages/CompareDetail'
import { ExamOverview } from './pages/ExamOverview'
import { Home } from './pages/Home'
import { LearnHub } from './pages/LearnHub'
import { Lesson } from './pages/Lesson'
import { Practice } from './pages/Practice'
import { PracticeRun } from './pages/PracticeRun'
import { Progress } from './pages/Progress'
import { Review } from './pages/Review'
import { ServiceDetail } from './pages/ServiceDetail'
import { Services } from './pages/Services'
import { Settings } from './pages/Settings'
import { Training } from './pages/Training'
import { useSettings } from './storage/settings'

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
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
          </GlossaryProvider>
        </NavigationProvider>
      </HashRouter>
    </StorageHealthProvider>
  )
}
