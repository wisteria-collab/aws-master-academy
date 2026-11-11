import { Link } from 'react-router-dom'
import { BackLink, usePageTitle } from '../components/Navigation'
import { Card, PageHeader } from '../components/ui'
import { appInfo } from '../config/app'
import { content, getExamSpec } from '../content'

const steps: { title: string; body: string; to: string; link: string }[] = [
  { title: '1. レッスンで全体をつかむ', body: 'まずCLFコースを順に読みます。各レッスンは「たとえ話 → 仕組み → 試験でのポイント → 確認問題」の順です。SAAコースは、CLFを終えてから進むと理解しやすくなります。', to: '/learn', link: '学ぶ' },
  { title: '2. 似たサービスを比べる', body: '試験でいちばん迷うのは、似たサービスの選び分けです。比較表と判断フローで違いを確かめ、トレーニングで「要件から選ぶ」練習をします。', to: '/compare', link: '類似サービス比較' },
  { title: '3. 構成図で組み合わせを学ぶ', body: 'お手本構成で、サービスの組み合わせ方を読み解きます。慣れてきたら、自分で構成図を作り、設計問題に挑戦します。', to: '/designer', link: '構成図シミュレーター' },
  { title: '4. 問題を解いて、間違いを復習する', body: '分野別やランダムの演習で、理解を確かめます。間違えた問題は、日をあけて自動でもう一度出題されます。', to: '/practice', link: '問題演習' },
  { title: '5. 模擬試験で仕上げる', body: '本番と同じ65問を、時間を計って解きます。分野別の正答率から、弱い分野を見つけて、演習に戻ります。', to: '/practice', link: '模擬試験' },
]

export function Guide() {
  usePageTitle('使い方')
  const clf = getExamSpec('clf')
  const saa = getExamSpec('saa')
  const count = (exam: 'clf' | 'saa') => content.questions.filter((q) => q.exam === exam).length
  return (
    <div className="flex flex-col gap-5">
      <BackLink fallback="/" fallbackLabel="ホーム" />
      <PageHeader title="使い方" lead="このアプリでの、おすすめの学習の進め方です。" />

      <Card>
        <h2 className="text-lg font-bold">おすすめの進め方</h2>
        <ol className="mt-2 flex flex-col gap-4">
          {steps.map((s) => (
            <li key={s.title}>
              <p className="text-base font-bold">{s.title}</p>
              <p className="mt-1 text-base leading-relaxed text-navy-800">{s.body}</p>
              <Link to={s.to} className="mt-2 inline-flex min-h-11 items-center rounded-xl border border-navy-600 px-4 text-base font-bold">
                {s.link}を開く
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">知っておくと便利なこと</h2>
        <ul className="mt-2 list-disc pl-5 text-base leading-relaxed text-navy-900">
          <li className="mt-1">点線の下線が付いた言葉は、タップすると意味が表示されます。</li>
          <li className="mt-1">画面の上の「戻る」は、直前に見ていた画面の、続きの位置に戻ります。</li>
          <li className="mt-1">サービス図鑑では、お気に入りと「学習済み」の印を付けられます。</li>
          <li className="mt-1">構成図は、箱をタップして選び、ドラッグか矢印のボタンで動かします。</li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">模擬試験の成績の読み方</h2>
        <p className="mt-2 text-base leading-relaxed text-navy-900">
          模擬試験の成績は、アプリ独自の正答率です。本番の試験は{clf?.scoreMin}〜{clf?.scoreMax}点のスケールドスコアで採点され、合格点は{clf?.code}が{clf?.passingScore}点、{saa?.code}が{saa?.passingScore}点です。この正答率は、本番のスコアや合格点とは直接対応しません。弱い分野を見つける目安として使ってください。
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">学習の記録とバックアップ</h2>
        <p className="mt-2 text-base leading-relaxed text-navy-900">
          学習の記録（進捗、解答の履歴、復習の予定、作った構成図、模擬試験の結果）は、この端末のブラウザの中に保存されます。外部には送信されません。ブラウザのデータを消したり、端末を替えたりすると、記録は引き継がれません。ときどき、バックアップを書き出しておくことをおすすめします。
        </p>
        <Link to="/settings" className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-navy-600 px-4 text-base font-bold">
          設定・バックアップを開く
        </Link>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">教材について</h2>
        <ul className="mt-2 list-disc pl-5 text-base leading-relaxed text-navy-900">
          <li className="mt-1">
            公開しているのは、AWSの公式情報と照合できた教材だけです。現在、レッスン{content.lessons.length}本、サービス{content.services.length}件、比較{content.comparisons.length}グループ、問題は{clf?.code}が{count('clf')}問・{saa?.code}が{count('saa')}問です。
          </li>
          <li className="mt-1">各教材の末尾に、出典、最終確認日、基準にした公式試験ガイドのバージョンを表示しています。</li>
          <li className="mt-1">比較表で「公式ドキュメントで確認する」と書かれた欄は、出典で確認できなかった項目です。料金や上限値は変わることがあるため、最新の情報は公式ページで確かめてください。</li>
          <li className="mt-1">問題は、このアプリのために作成した練習問題です。本番の試験問題ではありません。</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-navy-700">{appInfo.disclaimer}</p>
      </Card>
    </div>
  )
}
