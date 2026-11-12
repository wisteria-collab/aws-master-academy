import { usePageTitle } from '../components/Navigation'
import { Link } from 'react-router-dom'
import { BookIcon, CompareIcon, DiagramIcon, PencilIcon, RefreshIcon, SearchIcon } from '../components/icons'
import { Badge, Button, Card, CardTitle, LinkRow, Notice, ProgressBar, Stat } from '../components/ui'
import { features, type FeatureKey } from '../config/app'
import { learningConfig } from '../config/learning'
import { content, getExamSpec } from '../content'
import { useProgressSummary, type CourseProgress } from '../hooks/useProgressSummary'
import { useStorageHealth } from '../hooks/useStorageHealth'
import { addDays, formatDuration } from '../logic/dates'
import { formatRate } from '../logic/stats'
import { StudyPlanCard } from '../components/StudyPlanCard'
import { useSettings } from '../storage/settings'

function StatusBadge({ feature }: { feature: FeatureKey }) {
  const f = features[feature]
  if (!f.ready) return <Badge>準備中・Phase {f.phase}</Badge>
  return f.partial ? <Badge tone="good">一部公開中</Badge> : null
}

function CourseCard({ p }: { p: CourseProgress }) {
  const spec = getExamSpec(p.exam)
  return (
    <Link
      to={`/learn/${p.exam}`}
      className="block rounded-xl border border-navy-100 p-4 transition-colors hover:border-brand-500"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-bold">{spec?.code ?? p.exam.toUpperCase()}</p>
        {p.totalLessons > 0 && (
          <p className="text-base font-semibold text-navy-700">
            {p.completedLessons} / {p.totalLessons} レッスン
          </p>
        )}
      </div>
      <p className="text-sm text-navy-700">{spec?.nameJa}</p>
      {p.totalLessons > 0 ? (
        <div className="mt-3">
          <ProgressBar value={p.completedLessons} max={p.totalLessons} label={`${spec?.code}の学習進捗`} />
          <p className="mt-2 text-sm text-navy-700">
            正答率 {formatRate(p.rate)}（{p.answered}回解答）
          </p>
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">
          教材を準備中です。公開されるとここに進捗が表示されます。
        </p>
      )}
    </Link>
  )
}

export function Home() {
  const s = useProgressSummary()
  const health = useStorageHealth()
  const settings = useSettings()
  usePageTitle('ホーム')

  const backupOverdue =
    s.hasAnyRecord &&
    settings.backupReminderDismissedOn !== s.today &&
    (settings.lastBackupAt === null ||
      settings.lastBackupAt.slice(0, 10) < addDays(s.today, -learningConfig.backupReminderDays))

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">ホーム</h1>
        <p className="mt-1 text-base leading-relaxed text-navy-700">
          CLFからSAAへ、サービスを「比べて選べる」力を段階的に身につけます。
        </p>
      </header>

      {health.state === 'unavailable' && (
        <Notice tone="error" title="このブラウザでは学習履歴を保存できません">
          プライベートブラウズを使っている場合は、通常のウィンドウで開き直してください。このまま学習すると、閉じたときに記録が消えます。
        </Notice>
      )}

      {backupOverdue && (
        <Notice tone="warn" title="学習データのバックアップをおすすめします">
          <p>
            {settings.lastBackupAt
              ? `最後の書き出しから${learningConfig.backupReminderDays}日以上たっています。`
              : 'まだ一度も書き出していません。'}
            ブラウザのデータを消去すると記録も消えるため、ファイルに保存しておくと安心です。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/settings"
              className="inline-flex min-h-11 items-center rounded-xl bg-brand-500 px-4 font-bold text-navy-900"
            >
              バックアップ画面へ
            </Link>
            <Button onClick={() => settings.dismissBackupReminder(s.today)}>今日は閉じる</Button>
          </div>
        </Notice>
      )}

      <Card>
        <CardTitle
          aside={
            <Link to="/progress" className="text-base font-semibold text-navy-700 underline">
              詳しく見る
            </Link>
          }
        >
          学習進捗
        </CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <CourseCard p={s.clf} />
          <CourseCard p={s.saa} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat label="今日の学習" value={formatDuration(s.study.todaySeconds)} />
          <Stat label="累計の学習" value={formatDuration(s.study.totalSeconds)} />
          <Stat label="復習待ち" value={`${s.dueReviews.length}問`} />
        </div>
      </Card>

      <StudyPlanCard courses={[s.clf, s.saa]} today={s.today} />

      <Link to="/search" className="flex min-h-12 items-center gap-3 rounded-xl border border-navy-600 bg-white px-4 text-base font-bold">
        <SearchIcon />
        アプリ全体を検索する
      </Link>

      <section aria-labelledby="menu-title" className="flex flex-col gap-3">
        <h2 id="menu-title" className="text-lg font-bold">
          学習メニュー
        </h2>

        <Link
          to="/compare"
          className="flex items-center gap-3 rounded-2xl bg-navy-800 p-4 text-white shadow-sm transition-colors hover:bg-navy-700"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-navy-900">
            <CompareIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold">類似サービス比較</span>
              <Badge tone="brand">最重要</Badge>
              <span className="rounded-full border border-navy-600 px-2.5 py-0.5 text-sm">
                {content.comparisons.length}グループ公開中
              </span>
            </span>
            <span className="mt-0.5 block text-sm leading-relaxed text-navy-100">
              S3・EBS・EFS のような似たサービスを比べ、要件から選ぶ練習をします。
            </span>
          </span>
        </Link>

        <div className="grid gap-3 sm:grid-cols-2">
          <LinkRow to="/guide" title="使い方" note="おすすめの学習の進め方" icon={<BookIcon />} />
          <LinkRow
            to="/learn/clf"
            title="CLF学習"
            note="クラウドの基礎から体系的に学ぶ"
            icon={<BookIcon />}
            aside={<StatusBadge feature="clf" />}
          />
          <LinkRow
            to="/learn/saa"
            title="SAA学習"
            note="公式4分野・14タスクに沿った応用コース"
            icon={<BookIcon />}
            aside={<StatusBadge feature="saa" />}
          />
          <LinkRow
            to="/services"
            title="サービス図鑑"
            note="各サービスの役割・用途・試験ポイント"
            icon={<SearchIcon />}
            aside={<StatusBadge feature="services" />}
          />
          <LinkRow
            to="/designer"
            title="構成図シミュレーター"
            note="サービスを並べて構成を設計する"
            icon={<DiagramIcon />}
            aside={<StatusBadge feature="designer" />}
          />
          <LinkRow
            to="/practice"
            title="問題演習"
            note="分野別・サービス別・ランダム演習"
            icon={<PencilIcon />}
            aside={<StatusBadge feature="practice" />}
          />
          <LinkRow
            to="/review"
            title="苦手分野・復習"
            note={s.dueReviews.length > 0 ? `今日の復習が${s.dueReviews.length}問あります` : '間違えた問題を間隔をあけて再出題'}
            icon={<RefreshIcon />}
          />
        </div>
      </section>
    </div>
  )
}
