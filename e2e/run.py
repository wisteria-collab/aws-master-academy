import re
import json, os, shutil, subprocess, sys, time, tempfile
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:4173/'
OUT = '/home/claude/e2e/shots'; os.makedirs(OUT, exist_ok=True)
profile = tempfile.mkdtemp(prefix='ama-profile-')
results = []
def check(name, ok, detail=''):
    results.append((name, bool(ok), detail)); print(('PASS' if ok else 'FAIL'), name, detail)

def launch(p, viewport, mobile):
    return p.chromium.launch_persistent_context(profile, executable_path='/usr/bin/google-chrome', headless=True,
        viewport=viewport, is_mobile=mobile, has_touch=mobile, device_scale_factor=2 if mobile else 1,
        accept_downloads=True, args=['--no-sandbox'])

PAGES = ['', '#/learn', '#/learn/clf', '#/learn/saa', '#/learn/clf/clf-cloud-basics', '#/learn/clf/clf-regions-azs', '#/learn/clf/clf-shared-responsibility', '#/learn/clf/clf-storage', '#/learn/clf/clf-well-architected', '#/learn/clf/clf-migration-caf', '#/learn/clf/clf-compute', '#/learn/clf/clf-iam', '#/learn/clf/clf-security-governance', '#/learn/clf/clf-security-services', '#/learn/clf/clf-global-edge', '#/learn/clf/clf-database', '#/learn/clf/clf-network', '#/learn/clf/clf-cloud-economics', '#/learn/clf/clf-pricing-models', '#/learn/clf/clf-billing-cost', '#/learn/clf/clf-support-plans', '#/learn/clf/clf-ai-analytics', '#/learn/clf/clf-other-services', '#/services/amazon-quick', '#/services/amazon-appstream-2', '#/learn/clf/clf-deploy-operate', '#/learn/clf/clf-resources-partners', '#/services/aws-cloudformation', '#/services/aws-health-dashboard', '#/services/aws-support', '#/services/aws-organizations', '#/services/amazon-vpc', '#/services/amazon-rds', '#/services/amazon-cloudfront', '#/services/aws-iam', '#/services/aws-lambda', '#/services/elastic-load-balancing', '#/services', '#/services/amazon-s3', '#/services/amazon-fsx', '#/compare', '#/compare/storage', '#/compare/storage/training', '#/compare/database', '#/compare/compute', '#/compare/messaging', '#/compare/ec2-purchase', '#/compare/ec2-purchase/training', '#/compare/sg-nacl', '#/compare/vpc-endpoints', '#/compare/sg-nacl/training', '#/learn/saa/saa-secure-access', '#/learn/saa/saa-secure-workloads', '#/learn/saa/saa-data-security', '#/guide', '#/services/aws-compute-optimizer', '#/designer/templates/tpl-private-egress', '#/designer/templates/tpl-hybrid-connect', '#/designer/templates/tpl-data-lake', '#/designer/templates/tpl-dr-warm-standby', '#/designer/challenges/ch-ha-shop', '#/designer/challenges/ch-video-queue', '#/designer/challenges/ch-serverless-api', '#/designer/templates/tpl-static-website', '#/designer/templates/tpl-ha-web-3tier', '#/designer/templates/tpl-serverless-api', '#/designer/templates/tpl-decoupled-queue', '#/learn/saa/saa-cost-storage', '#/learn/saa/saa-cost-compute', '#/learn/saa/saa-cost-database', '#/learn/saa/saa-cost-network', '#/compare/nat-options', '#/compare/nat-options/training', '#/learn/saa/saa-perf-network', '#/learn/saa/saa-perf-data', '#/compare/vpc-connectivity', '#/compare/data-transfer', '#/services/aws-transit-gateway', '#/learn/saa/saa-perf-storage', '#/learn/saa/saa-perf-compute', '#/learn/saa/saa-perf-database', '#/compare/s3-storage-classes', '#/compare/ebs-volume-types', '#/services/amazon-rds-proxy', '#/learn/saa/saa-scalable-loose', '#/learn/saa/saa-ha-ft', '#/compare/rds-ha', '#/compare/load-balancers', '#/compare/dr-strategies', '#/compare/dr-strategies/training', '#/services/amazon-api-gateway', '#/services/amazon-cognito', '#/practice/run?exam=saa&mode=random', '#/services/aws-application-migration-service', '#/designer', '#/practice', '#/practice/run?exam=clf&mode=random', '#/progress', '#/review', '#/settings', '#/nope']

with sync_playwright() as p:
    ctx = launch(p, {'width': 390, 'height': 844}, True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    # 1. 全画面がスマートフォン幅で横にはみ出さない
    for path in PAGES:
        page.goto(BASE + path); page.wait_for_timeout(350)
        w = page.evaluate('[document.documentElement.scrollWidth, window.innerWidth]')
        check(f'横はみ出しなし {path or "/"}', w[0] <= w[1], str(w))
        small = page.evaluate('''() => [...document.querySelectorAll('main *, nav *')].filter(e => !e.closest('svg') && e.children.length===0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 14).map(e => e.textContent.trim().slice(0,20))''')
        check(f'文字14px以上 {path or "/"}', len(small) == 0, str(small[:3]))
        page.screenshot(path=f'{OUT}/m-{(path or "home").replace("#/","").replace("/","-").replace("?","-").replace("&","-")}.png', full_page=True)

    page.goto(BASE); page.get_by_text('0 / 21').first.wait_for(timeout=5000); page.wait_for_timeout(500)   # 進捗は保存領域を読んでから表示される
    body = page.inner_text('body')
    for word in ['学習進捗', 'CLF学習', 'SAA学習', 'サービス図鑑', '類似サービス比較', '構成図シミュレーター', '問題演習', '苦手分野・復習', 'AWS非公式']:
        check(f'ホームに「{word}」', word in body)
    # 学習時間は、直前のページ巡回でレッスンを開いた分が正しく記録されるため、0分とは限らない
    check('架空の進捗を出していない', '0 / 21' in body and '0 / 14' in body and '正答率' not in body.split('学習進捗')[0], body[:400])

    # 下部タブで遷移
    page.get_by_role('navigation', name='メインメニュー').last.get_by_role('link', name='記録').click()
    page.wait_for_timeout(200)
    check('下部タブで記録へ', page.url.endswith('#/progress'), page.url)

    # 2. 試験概要
    page.goto(BASE + '#/learn/saa'); page.wait_for_timeout(300)
    t = page.inner_text('main')
    check('SAA概要 130分/65問/720', all(x in t for x in ['130分', '65問', '720', '30%', '26%', '24%', '20%']))
    page.goto(BASE + '#/learn/clf'); page.wait_for_timeout(300)
    t = page.inner_text('main')
    check('CLF概要 90分/65問/700', all(x in t for x in ['90分', '65問', '700', '24%', '30%', '34%', '12%']))
    check('出典・ガイド版・確認日を表示', '出典' in t and '最終確認日：2026/11/11' in t and 'Version 1.3' in t and '2026/10/29' in t)

    # 3. 学習時間の計測（学習画面で操作しながら約17秒）
    for i in range(6):
        page.mouse.wheel(0, 200); page.touchscreen.tap(200, 300); page.wait_for_timeout(3000)
    page.goto(BASE + '#/settings'); page.wait_for_timeout(500)
    t = page.inner_text('main')
    check('学習時間が記録された', '学習時間の記録' in t and '学習時間の記録0件' not in t.replace('\n',''), '')
    secs = page.evaluate('''() => new Promise(r => { const q = indexedDB.open('aws-master-academy'); q.onsuccess = () => { const g = q.result.transaction('studySessions').objectStore('studySessions').getAll(); g.onsuccess = () => r(g.result) } })''')
    learn = lambda rows: next((r['seconds'] for r in rows if r['feature'] == 'learn'), None)
    # 上限は巡回するレッスンページの数に比例する（第4弾で3ページ増えたため 30→45 秒、第5弾で4ページ増えたため 45→60 秒）
    check('記録秒数が妥当(10〜190秒)', learn(secs) is not None and 10 <= learn(secs) <= 190, json.dumps(secs))
    before = learn(secs); total_before = len(secs)
    ctx.close()

    # 4. ブラウザを閉じて開き直しても残る
    ctx = launch(p, {'width': 390, 'height': 844}, True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '#/settings'); page.wait_for_timeout(600)
    secs2 = page.evaluate('''() => new Promise(r => { const q = indexedDB.open('aws-master-academy'); q.onsuccess = () => { const g = q.result.transaction('studySessions').objectStore('studySessions').getAll(); g.onsuccess = () => r(g.result) } })''')
    check('再起動後もデータが残る', len(secs2) == total_before and learn(secs2) == before, json.dumps(secs2))

    # 設定（文字サイズ）が LocalStorage に残る
    page.get_by_role('button', name='大きめ').click(); page.wait_for_timeout(100)
    check('文字サイズ変更', page.evaluate('getComputedStyle(document.documentElement).fontSize') == '18px')

    # 5. バックアップ書き出し
    with page.expect_download() as d:
        page.get_by_role('button', name='バックアップを書き出す').click()
    dl = d.value; path = '/home/claude/e2e/backup.json'; dl.save_as(path)
    data = json.load(open(path))
    check('書き出しファイル名', dl.suggested_filename.startswith('aws-master-academy-backup-') and dl.suggested_filename.endswith('.json'), dl.suggested_filename)
    check('書き出し内容', data['app'] == 'aws-master-academy' and data['schemaVersion'] == 1 and len(data['stores']['studySessions']) == total_before)
    page.wait_for_timeout(200)
    check('最後の書き出し日時を表示', 'まだありません' not in page.inner_text('main'))

    # 6. 全削除
    page.get_by_role('button', name='すべての学習データを削除…').click()
    page.get_by_role('button', name='本当に削除する').click(); page.wait_for_timeout(400)
    n = page.evaluate('''() => new Promise(r => { const q = indexedDB.open('aws-master-academy'); q.onsuccess = () => { const g = q.result.transaction('studySessions').objectStore('studySessions').count(); g.onsuccess = () => r(g.result) } })''')
    check('全削除で0件', n == 0, str(n))

    # 7. 壊れたファイルは拒否
    bad = '/home/claude/e2e/bad.json'; open(bad, 'w').write('{"hello": 1}')
    page.set_input_files('input[type=file]', bad); page.wait_for_timeout(300)
    check('別ファイルを拒否', 'このアプリのバックアップファイルではありません' in page.inner_text('main'))

    # 8. 読み込み（統合）で復元
    page.set_input_files('input[type=file]', path); page.wait_for_timeout(300)
    check('読み込み前に件数を表示', '合計' in page.inner_text('main') and '書き出し日時' in page.inner_text('main'))
    page.screenshot(path=f'{OUT}/m-settings-import.png', full_page=True)
    page.get_by_role('button', name='今のデータに統合する').click(); page.wait_for_timeout(500)
    secs3 = page.evaluate('''() => new Promise(r => { const q = indexedDB.open('aws-master-academy'); q.onsuccess = () => { const g = q.result.transaction('studySessions').objectStore('studySessions').getAll(); g.onsuccess = () => r(g.result) } })''')
    check('バックアップから復元', len(secs3) == total_before and learn(secs3) == before, json.dumps(secs3))

    # 9. 置き換えの確認ステップ
    page.set_input_files('input[type=file]', path); page.wait_for_timeout(300)
    page.get_by_role('button', name='置き換える…').click()
    check('置き換えは確認を挟む', '今の学習データはすべて消えます' in page.inner_text('main'))
    page.get_by_role('button', name='消して置き換える').click(); page.wait_for_timeout(400)
    check('置き換え完了', 'バックアップの内容で置き換えました' in page.inner_text('main'))

    # 進捗画面に反映
    page.goto(BASE + '#/progress'); page.wait_for_timeout(500)
    page.screenshot(path=f'{OUT}/m-progress-data.png', full_page=True)
    check('進捗画面に学習時間', '直近7日間' in page.inner_text('main') and 'この7日間の記録はまだありません' not in page.inner_text('main'))

    # ================= Phase 3：講義・図鑑・問題・比較 =================
    def db_all(store):
        return page.evaluate("""(s) => new Promise(r => { const q = indexedDB.open('aws-master-academy'); q.onsuccess = () => { const g = q.result.transaction(s).objectStore(s).getAll(); g.onsuccess = () => r(g.result) } })""", store)
    def pick(text):
        page.locator('label', has_text=text).first.click()
    def submit():
        page.get_by_role('button', name='解答する').click(); page.wait_for_timeout(250)
    def nxt():
        page.locator('button', has_text='次の問題へ').or_(page.locator('button', has_text='結果を見る')).first.click(); page.wait_for_timeout(250)

    page.goto(BASE + '#/learn/clf'); page.wait_for_timeout(400)
    t = page.inner_text('main')
    check('コースにレッスン10本', 'IAM（アクセス管理）' in t and 'セキュリティのサービスとリソース' in t and 'セキュリティ・ガバナンス・コンプライアンスの概念' in t)
    check('コースにレッスン7本', all(x in t for x in ['クラウドコンピューティングとは', 'リージョンとアベイラビリティゾーン', 'セキュリティと責任共有モデル', 'ストレージサービス', 'AWS Well-Architected Framework', 'クラウド移行とAWS CAF', 'コンピューティングサービス']))
    for lid in ['clf-well-architected', 'clf-compute', 'clf-iam', 'clf-global-edge', 'clf-database', 'clf-network', 'clf-pricing-models', 'clf-billing-cost', 'clf-deploy-operate', 'clf-ai-analytics']:
        page.goto(BASE + f'#/learn/clf/{lid}'); page.wait_for_timeout(400)
        check(f'図解を表示 {lid}', page.locator('main svg[role=img]').count() == 1)
        page.locator('main svg[role=img]').screenshot(path=f'{OUT}/fig-{lid}.png')

    page.goto(BASE + '#/learn/clf/clf-storage'); page.wait_for_timeout(500)
    t = page.inner_text('main')
    check('レッスンの7ブロック', all(x in t for x in ['概要', 'かんたんに言うと', '具体的な利用場面', '仕組み', '関連するAWSサービス', '試験で重要なポイント', '確認問題']))
    check('図解を表示', page.locator('main svg[role=img]').count() >= 1)
    check('たとえを表示', 'たとえると' in t)
    page.get_by_role('button', name='オブジェクトストレージ').first.click(); page.wait_for_timeout(200)
    check('用語をタップで説明', page.get_by_test_id('glossary-popover').is_visible())
    page.get_by_role('button', name='説明を閉じる').click(); page.wait_for_timeout(150)
    check('解答前は解説を出さない', '正解です' not in t and 'この選択肢を外す根拠' not in t)
    check('未選択では解答できない', page.get_by_role('button', name='解答する').is_disabled())
    pick('Amazon S3'); submit()
    t = page.inner_text('main')
    check('正解の判定', '正解です' in t and '不正解です' not in t)
    check('全選択肢に解説', t.count('× 不正解') == 3 and t.count('○ 正解') == 1 and t.count('この選択肢を外す根拠になる条件') == 3)
    check('判断ポイント・キーワード・出典', all(x in t for x in ['判断のポイント', '問題文の重要なキーワード', '関連するサービス・教材', '基準：CLF-C02 試験ガイド Version 1.3']))
    page.screenshot(path=f'{OUT}/m-question-explained.png', full_page=True)
    nxt()
    pick('担当者が定期的に'); submit()
    check('不正解の判定', '不正解です' in page.inner_text('main'))
    nxt()
    pick('失われる'); submit(); nxt()
    t = page.inner_text('main')
    check('結果表示', '2 / 3 問正解' in t and '復習リストに追加' in t)
    att = db_all('attempts'); rev = db_all('reviewItems'); lp = db_all('lessonProgress')
    check('解答履歴を保存', len(att) == 3 and sorted(a['correct'] for a in att) == [False, True, True] and all(a['mode'] == 'lesson' for a in att), str(len(att)))
    check('間違えた問題が復習リストに', len(rev) == 1 and rev[0]['questionId'] == 'clf-q-storage-02' and rev[0]['stage'] == 0, json.dumps(rev))
    check('レッスンが完了になる', any(l['lessonId'] == 'clf-storage' and l['status'] == 'completed' for l in lp), json.dumps(lp))
    page.goto(BASE + '#/learn/clf'); page.wait_for_timeout(400)
    check('コース画面に完了を反映', '1 / 21 完了' in page.inner_text('main'))

    # 複数選択問題
    page.goto(BASE + '#/learn/clf/clf-shared-responsibility'); page.wait_for_timeout(500)
    pick('利用者（お客様）'); submit(); nxt()
    pick('データセンターの物理的なセキュリティ'); submit(); nxt()
    check('複数選択の案内', '2つ選んでください' in page.inner_text('main'))
    pick('保存するデータの暗号化オプション')
    check('複数選択は必要数を選ぶまで解答できない', page.get_by_role('button', name='解答する').is_disabled())
    pick('IAMを使って適切なアクセス権限'); submit()
    check('複数選択の正解判定', '正解です' in page.inner_text('main') and '不正解です' not in page.inner_text('main'))
    nxt()
    for ans in ['物理的・環境的な統制', 'AWSは基盤のパッチ適用に責任を持ち', '基盤の層、OS、プラットフォーム', 'それぞれ自社の従業員に対して行う']:
        pick(ans); submit(); nxt()
    check('責任共有レッスン全問正解', '7 / 7 問正解' in page.inner_text('main'))

    # サービス図鑑
    page.goto(BASE + '#/services'); page.wait_for_timeout(400)
    check('図鑑に94サービス', page.locator('main ul li a').count() == 94)
    page.get_by_placeholder('サービス名で検索').fill('efs'); page.wait_for_timeout(200)
    check('検索で絞り込み（名前の一致が先頭）', 1 <= page.locator('main ul li a').count() <= 5 and 'Amazon EFS' in page.locator('main ul li a').first.inner_text())
    page.locator('main ul li a').first.click(); page.wait_for_timeout(400)
    page.get_by_role('button', name='学習済みにする').click(); page.wait_for_timeout(200)
    page.get_by_role('button', name='☆ お気に入りに追加').click(); page.wait_for_timeout(200)
    t = page.inner_text('main')
    check('学習済み・お気に入り', '✓ 学習済み' in t and '★ お気に入り' in t)
    page.get_by_role('tab', name='試験対策').click(); page.wait_for_timeout(150)
    check('試験対策タブ', '試験で重要なポイント' in page.inner_text('main') and '関連する試験分野' in page.inner_text('main'))
    check('図鑑の必須項目', all(x in page.inner_text('main') for x in ['仕組み', 'メリット', 'デメリット・制約', '類似サービス', '公式ドキュメントを開く', '類似サービスと比べる']))
    page.goto(BASE + '#/services'); page.wait_for_timeout(300)
    page.locator('select').nth(1).select_option('learned'); page.wait_for_timeout(200)
    check('学習済みで絞り込み', page.locator('main ul li a').count() == 1)

    # 比較
    page.goto(BASE + '#/compare/storage'); page.wait_for_timeout(500)
    t = page.inner_text('main')
    check('比較の12項目', all(x in t for x in ['基本的な役割', '仕組み', 'データの扱い方', '主な利用用途', '可用性', 'パフォーマンス', '拡張性', 'コストの考え方', '運用負荷', '制約', '選択すべき場面', '選択してはいけない場面']))
    check('比較に図解', page.locator('main svg[role=img]').count() >= 1)
    page.get_by_role('button', name='はい').first.click(); page.wait_for_timeout(150)
    page.get_by_role('button', name='いいえ').nth(1).click(); page.wait_for_timeout(150)
    t = page.inner_text('main')
    check('判断フローでEFSに到達', 'この条件に合うのは' in t and 'みんなで使う共有キャビネット' in t.split('この条件に合うのは')[1][:120])
    page.screenshot(path=f'{OUT}/m-compare-flow.png', full_page=True)
    page.goto(BASE + '#/compare/storage/training'); page.wait_for_timeout(500)
    for ans in ['Amazon EFS', 'Amazon FSx for Windows File Server', 'Amazon EBS', 'Amazon S3']:
        pick(ans); submit(); nxt()
    check('選択トレーニング全問正解', '4 / 4 問正解' in page.inner_text('main'))
    page.goto(BASE + '#/compare'); page.wait_for_timeout(400)
    check('比較一覧に正答率', '正答率 100%' in page.inner_text('main'))

    # 構成図シミュレーター
    page.goto(BASE + '#/designer'); page.wait_for_timeout(400)
    t = page.inner_text('main')
    check('構成図：お手本構成の一覧', 'お手本構成' in t and '公開中 8 / 予定 8' in t and '可用性の高い3層ウェブアプリケーション' in t)
    page.get_by_role('link', name=re.compile('キューで疎結合にした処理')).click(); page.wait_for_timeout(400)
    check('構成図：お手本の詳細', 'まだ箱が選ばれていません' in page.inner_text('main') and page.locator('figure svg').count() >= 1)
    page.get_by_role('button', name='Amazon SQS').click(); page.wait_for_timeout(200)
    t = page.locator('[aria-live=polite]').inner_text()
    check('構成図：箱を選ぶと役割が出る', 'キューです' in t and '図鑑で Amazon SQS を見る' in t)
    page.get_by_role('link', name='図鑑で Amazon SQS を見る').click(); page.wait_for_timeout(400)
    check('構成図：図鑑へ移動', 'Amazon SQS' in page.inner_text('main'))
    page.go_back(); page.wait_for_timeout(400)
    check('構成図：戻ると選択が復元される', 'キューです' in page.locator('[aria-live=polite]').inner_text())

    # 構成図を自分で作る
    page.goto(BASE + '#/designer'); page.wait_for_timeout(400)
    page.get_by_role('button', name='新しい構成図を作る').click(); page.wait_for_timeout(500)
    check('作図：新しい図を開く', '#/designer/edit/dg-' in page.url and 'まだ何もありません' in page.inner_text('main'))
    page.get_by_label('構成図の名前').fill('テストの構成図')
    for q, nm in [('EC2', 'Amazon EC2'), ('RDS', 'Amazon RDS')]:
        page.get_by_role('button', name='＋ サービス').click()
        page.get_by_placeholder('サービス名で探す（例：S3、データベース）').fill(q)
        page.get_by_role('list', name='サービスの候補').get_by_role('button', name=re.compile('^' + nm + ' ')).first.click(); page.wait_for_timeout(150)
    svg = page.locator('figure svg')
    check('作図：箱が2つ追加される', svg.get_by_role('button', name='Amazon EC2', exact=True).count() == 1 and svg.get_by_role('button', name='Amazon RDS', exact=True).count() == 1)
    svg.get_by_role('button', name='Amazon EC2', exact=True).click(); page.wait_for_timeout(100)
    check('作図：箱を選ぶと操作が出る', '選択中：箱' in page.inner_text('main') and '図鑑で見る' in page.inner_text('main'))
    page.get_by_role('button', name='線をつなぐ').click()
    check('作図：つなぐ先の案内', 'つなぐ先の箱をタップしてください' in page.inner_text('main'))
    svg.get_by_role('button', name='Amazon RDS', exact=True).click(); page.wait_for_timeout(150)
    t = page.inner_text('main')
    check('作図：線がつながる', '選択中：線' in t and 'Amazon EC2 → Amazon RDS' in t)
    page.get_by_label(re.compile('線の名前')).fill('読み書き'); page.wait_for_timeout(100)
    check('作図：線の名前が図に出る', '読み書き' in svg.text_content())
    page.get_by_role('button', name='向きを逆にする').click(); page.wait_for_timeout(100)
    check('作図：線の向きを逆にする', 'Amazon RDS → Amazon EC2' in page.inner_text('main'))
    page.get_by_role('button', name='元に戻す').click(); page.wait_for_timeout(100)
    svg.get_by_role('button', name=re.compile('^線：')).click(); page.wait_for_timeout(100)
    check('作図：元に戻す', 'Amazon EC2 → Amazon RDS' in page.inner_text('main'))
    # ドラッグで動かす
    box = svg.get_by_role('button', name='Amazon RDS', exact=True).bounding_box()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2); page.mouse.down()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2 + 60, steps=6); page.mouse.up(); page.wait_for_timeout(150)
    box2 = svg.get_by_role('button', name='Amazon RDS', exact=True).bounding_box()
    check('作図：ドラッグで箱が動く', box2['y'] - box['y'] > 40, f"{box['y']} -> {box2['y']}")
    page.get_by_role('button', name='＋ 枠').click(); page.get_by_role('button', name='VPC', exact=True).click(); page.wait_for_timeout(150)
    check('作図：枠を追加', svg.get_by_role('button', name='枠：VPC', exact=True).count() == 1 and '選択中：枠' in page.inner_text('main'))
    page.wait_for_timeout(700)
    check('作図：自動保存の表示', '自動で保存しました' in page.inner_text('main'))
    page.reload(); page.wait_for_timeout(700)
    svg = page.locator('figure svg')
    box3 = svg.get_by_role('button', name='Amazon RDS', exact=True).bounding_box()
    check('作図：再読み込みしても残る', page.get_by_label('構成図の名前').input_value() == 'テストの構成図' and '読み書き' in svg.text_content() and abs(box3['y'] - box2['y']) < 3)
    page.goto(BASE + '#/designer'); page.wait_for_timeout(400)
    check('作図：一覧に出る', 'テストの構成図' in page.inner_text('main') and '箱 3個・線 1本' in page.inner_text('main'))
    page.goto(BASE + '#/designer/templates/tpl-serverless-api'); page.wait_for_timeout(400)
    page.get_by_role('button', name='コピーして編集する').click(); page.wait_for_timeout(600)
    check('作図：お手本をコピーして編集', '#/designer/edit/dg-' in page.url and page.get_by_label('構成図の名前').input_value() == 'サーバーレスのAPI（コピー）' and page.locator('figure svg').get_by_role('button', name='AWS Lambda', exact=True).count() == 1)
    page.get_by_role('button', name='削除する', exact=True).click(); page.get_by_role('button', name='本当に削除する').click(); page.wait_for_timeout(500)
    t = page.inner_text('main')
    check('作図：削除すると一覧から消える', 'サーバーレスのAPI（コピー）' not in t and 'テストの構成図' in t)

    # 設計問題
    page.goto(BASE + '#/designer'); page.wait_for_timeout(400)
    t = page.inner_text('main')
    check('設計問題：一覧', '設計問題' in t and '止まらないネットショップ' in t and '未挑戦' in t)
    page.get_by_role('link', name=re.compile('写真館のウェブサイトを世界に届ける')).click(); page.wait_for_timeout(400)
    t = page.inner_text('main')
    check('設計問題：状況と要件', '満たしたい要件' in t and 'サーバーを管理しない' in t and '構成図を作ると、ここに観点ごとの講評が表示されます' in t)
    page.get_by_role('button', name='構成図を作りはじめる').click(); page.wait_for_timeout(500)
    check('設計問題：作図画面に問題が出る', '設計問題：写真館のウェブサイトを世界に届ける' in page.inner_text('main'))
    for q, nm in [('CloudFront', 'Amazon CloudFront'), ('S3', 'Amazon S3')]:
        page.get_by_role('button', name='＋ サービス').click()
        page.get_by_placeholder('サービス名で探す（例：S3、データベース）').fill(q)
        page.get_by_role('list', name='サービスの候補').get_by_role('button', name=re.compile('^' + nm + ' ')).first.click(); page.wait_for_timeout(150)
    page.wait_for_timeout(600)
    page.get_by_role('link', name='講評を見る').click(); page.wait_for_timeout(500)
    t = page.inner_text('main')
    check('設計問題：線がないと一部だけ満たす', '5個の観点のうち、3個を満たしています' in t and 'まだ' in t, t[:0])
    page.get_by_role('button', name='自分の構成図を直す').click(); page.wait_for_timeout(500)
    svg = page.locator('figure svg')
    svg.get_by_role('button', name='Amazon CloudFront', exact=True).click(); page.get_by_role('button', name='線をつなぐ').click()
    svg.get_by_role('button', name='Amazon S3', exact=True).click(); page.wait_for_timeout(150)
    page.get_by_role('button', name='＋ サービス').click()
    page.get_by_placeholder('サービス名で探す（例：S3、データベース）').fill('Route 53')
    page.get_by_role('list', name='サービスの候補').get_by_role('button', name=re.compile('^Amazon Route 53 ')).first.click(); page.wait_for_timeout(700)
    page.get_by_role('link', name='講評を見る').click(); page.wait_for_timeout(500)
    check('設計問題：直すとすべて満たす', '5個の観点のうち、5個を満たしています' in page.inner_text('main'))
    page.get_by_role('button', name='模範解答を見る').click(); page.wait_for_timeout(200)
    t = page.inner_text('main')
    check('設計問題：模範解答', '模範解答の例' in t and 'お手本構成「静的ウェブサイトの配信」で詳しく見る' in t)
    page.goto(BASE + '#/designer'); page.wait_for_timeout(400)
    t = page.inner_text('main')
    check('設計問題：一覧に結果が出る', '観点 5 / 5' in t and '設計問題：写真館' not in t.split('設計問題')[0])

    # 模擬試験
    page.goto(BASE + '#/practice'); page.wait_for_timeout(500)
    t = page.inner_text('main')
    check('模擬試験：案内と注意書き', '本番と同じ 65問・90分' in t and '直接対応しません' in t and '苦手分野演習' in t and '準備中のモード' not in t)
    page.get_by_role('button', name='CLF-C02 の模擬試験を始める').click(); page.wait_for_timeout(700)
    t = page.inner_text('main')
    check('模擬試験：開始', '#/exam/run/' in page.url and '1 / 65' in t and '残り 1:' in t and '解説' not in t and '正解です' not in t)
    for i in range(3):
        page.locator('fieldset label').first.click(); page.wait_for_timeout(80)
        if i == 1: page.get_by_role('button', name='あとで見直す').click()
        page.get_by_role('button', name='次の問題').click(); page.wait_for_timeout(120)
    t = page.inner_text('main')
    check('模擬試験：解答しても正誤を出さない', '4 / 65' in t and '解答済み 3 / 65・見直し 1' in t and '不正解' not in t)
    run_url = page.url
    page.get_by_role('link', name=re.compile('中断する')).click(); page.wait_for_timeout(500)
    t = page.inner_text('main')
    check('模擬試験：中断すると再開の案内が出る', '途中の模擬試験があります（解答済み 3 / 65' in t)
    page.get_by_role('link', name='続きから再開する').click(); page.wait_for_timeout(600)
    check('模擬試験：続きから再開', page.url == run_url and '4 / 65' in page.inner_text('main') and '解答済み 3 / 65' in page.inner_text('main'))
    page.reload(); page.wait_for_timeout(700)
    check('模擬試験：再読み込みしても残る', '解答済み 3 / 65・見直し 1' in page.inner_text('main'))
    page.get_by_role('button', name='試験を終了して採点する').click()
    check('模擬試験：未解答の確認', '未解答が 62 問あります' in page.inner_text('main'))
    page.get_by_role('button', name='採点する', exact=True).click(); page.wait_for_timeout(1200)
    t = page.inner_text('main')
    check('模擬試験：結果', '#/exam/result/' in page.url and '正答率（アプリ独自）' in t and '65問中' in t and '未解答 62問' in t and '合格点は700点' in t and '直接対応しません' in t)
    check('模擬試験：分野別', all(x in t for x in ['分野別の正答率', '出題比率 24%・16問中', '出題比率 30%・19問中', '出題比率 34%・22問中', '出題比率 12%・8問中']))
    page.get_by_role('button', name=re.compile('^すべて')).click(); page.wait_for_timeout(200)
    page.get_by_role('button', name=re.compile('^(○|×)\\s*1問目')).click(); page.wait_for_timeout(300)
    check('模擬試験：振り返りで解説が出る', '判断のポイント' in page.inner_text('main') and '（あなたの解答）' in page.inner_text('main'))
    page.goto(run_url); page.wait_for_timeout(600)
    check('模擬試験：採点後は解答画面に戻れない', '#/exam/result/' in page.url)
    page.goto(BASE + '#/practice'); page.wait_for_timeout(500)
    t = page.inner_text('main')
    check('模擬試験：履歴が出る', 'これまでの結果' in t and '65問中' in t and '途中の模擬試験があります' not in t)
    page.goto(BASE + '#/progress'); page.wait_for_timeout(500)
    check('模擬試験：進捗に成績が出る', '受験回数：1回' in page.inner_text('main'))
    page.goto(BASE + '#/practice/run?exam=clf&mode=weak'); page.wait_for_timeout(600)
    check('苦手分野演習：出題される', '苦手分野演習' in page.inner_text('main') and '1 / ' in page.inner_text('main'))

    # 料金の案内（AWS公式へのリンク）
    page.goto(BASE + '#/services/amazon-s3'); page.wait_for_timeout(400)
    t = page.inner_text('main')
    link = page.get_by_role('link', name='Amazon S3 の料金ページ（AWS公式）')
    check('料金：確認済みのサービスに料金ページのリンク', '料金を調べる（AWS公式）' in t and link.get_attribute('href') == 'https://aws.amazon.com/jp/s3/pricing/' and '料金がかかるもの' in t)
    check('料金：公式の料金一覧と計算ツール', page.get_by_role('link', name=re.compile('AWS公式 料金一覧')).get_attribute('href') == 'https://aws.amazon.com/jp/pricing/' and page.get_by_role('link', name=re.compile('AWS料金計算ツール')).get_attribute('href') == 'https://calculator.aws/')
    page.goto(BASE + '#/services/aws-iam'); page.wait_for_timeout(400)
    check('料金：未確認のサービスは、その旨を表示', '個別の料金ページは、まだ確認できていません' in page.inner_text('main'))
    page.goto(BASE + '#/compare/storage'); page.wait_for_timeout(400)
    check('料金：比較ページにも案内', page.get_by_role('link', name='Amazon S3 の料金ページ（AWS公式）').count() == 1 and page.get_by_role('link', name='Amazon EBS の料金ページ（AWS公式）').count() == 1)
    page.goto(BASE + '#/guide'); page.wait_for_timeout(400)
    check('料金：使い方ページに公式資料4件', page.get_by_role('link', name=re.compile('AWS料金体系の仕組み')).count() == 1 and page.get_by_role('link', name=re.compile('公式ドキュメント')).count() >= 1)

    # 演習・進捗・復習
    page.goto(BASE + '#/practice'); page.wait_for_timeout(400)
    t = page.inner_text('main')
    check('演習メニュー', all(x in t for x in ['ランダム演習', '分野別演習', 'サービス別演習', '公開中 148 問']))
    page.goto(BASE + '#/practice/run?exam=clf&mode=domain&domain=clf-d1'); page.wait_for_timeout(500)
    check('分野別演習の出題', '1 / 26' in page.inner_text('main') and '分野別演習：クラウドのコンセプト' in page.inner_text('main'))
    page.goto(BASE + '#/progress'); page.wait_for_timeout(500)
    t = page.inner_text('main')
    check('分野別の理解度', '各問題の最新の解答で集計' in t and re.search(r'\d+%', t) is not None)
    check('苦手サービスにS3', 'Amazon S3' in t.split('苦手サービスランキング')[1].split('模擬試験')[0] and '比較で確認' in t)
    page.screenshot(path=f'{OUT}/m-progress-phase3.png', full_page=True)
    page.goto(BASE); page.wait_for_timeout(400)
    check('ホームにCLF進捗', '2 / 21 レッスン' in page.inner_text('main'))
    page.goto(BASE + '#/review'); page.wait_for_timeout(400)
    t = page.inner_text('main')
    check('復習予定1問・今日は0問', '今日の復習はありません' in t and '★ Amazon EFS' in t)

    # ================= 操作性の改善：用語ポップアップ・元の場所に戻る =================
    def ux_checks(tag, vw):
        sy = lambda: page.evaluate('Math.round(window.scrollY)')
        pop = page.get_by_test_id('glossary-popover')
        page.goto(BASE + '#/learn/clf/clf-storage'); page.wait_for_timeout(500)
        terms = page.locator('main button[aria-haspopup=dialog]')
        n = terms.count()
        check(f'[{tag}] タップできる用語が区別されている', n >= 3 and page.evaluate("""() => { const b = document.querySelector('main button[aria-haspopup=dialog]'); const c = getComputedStyle(b); return c.textDecorationLine.includes('underline') && c.backgroundColor !== 'rgba(0, 0, 0, 0)' }"""))
        ok_in, ok_near, ok_scroll, ok_content = True, True, True, True
        for i in range(n):
            t = terms.nth(i); t.scroll_into_view_if_needed(); page.wait_for_timeout(80)
            y0 = sy(); t.evaluate('el => el.click()'); page.wait_for_timeout(180)
            b = pop.bounding_box(); a = t.bounding_box()
            ok_in = ok_in and b is not None and b['x'] >= 0 and b['x'] + b['width'] <= vw + 0.5
            ok_near = ok_near and b is not None and (abs(b['y'] - (a['y'] + a['height'])) <= 12 or abs((b['y'] + b['height']) - a['y']) <= 12)
            txt = pop.inner_text()
            ok_content = ok_content and all(x in txt for x in ['意味', 'かんたんに言うと', '具体例']) and t.inner_text() in txt
            ok_scroll = ok_scroll and sy() == y0
            if i == 0: page.screenshot(path=f'{OUT}/{tag}-glossary-popover.png')
            page.get_by_role('button', name='説明を閉じる').evaluate('el => el.click()'); page.wait_for_timeout(100)
            ok_scroll = ok_scroll and sy() == y0 and pop.count() == 0
        check(f'[{tag}] ポップアップが画面からはみ出さない（全{n}語）', ok_in)
        check(f'[{tag}] ポップアップが用語のすぐ近くに出る', ok_near)
        check(f'[{tag}] 意味・初心者向け説明・具体例を表示', ok_content)
        check(f'[{tag}] 開閉してもスクロール位置が変わらない', ok_scroll)
        # 実際のタップ操作でも確認する（用語を画面の中ほどに置く）
        t = terms.nth(0)
        page.evaluate("(el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 200)", t.element_handle()); page.wait_for_timeout(200)
        y0 = sy(); bb = t.bounding_box()
        (page.mouse.click if vw > 1000 else page.touchscreen.tap)(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); page.wait_for_timeout(200)
        opened = pop.count() == 1 and sy() == y0
        cb = page.get_by_role('button', name='説明を閉じる').bounding_box()
        (page.mouse.click if vw > 1000 else page.touchscreen.tap)(cb['x'] + cb['width'] / 2, cb['y'] + cb['height'] / 2); page.wait_for_timeout(200)
        check(f'[{tag}] 実際のタップで開閉でき、位置が変わらない', opened and pop.count() == 0 and sy() == y0, f'{sy()} vs {y0}')
        w = page.evaluate('[document.documentElement.scrollWidth, window.innerWidth]')
        check(f'[{tag}] ポップアップ表示で横スクロールが出ない', w[0] <= w[1], str(w))
        # 画面の下端近くの用語では、上側に表示する
        t = terms.nth(n - 1)
        page.evaluate("(el) => { const r = el.getBoundingClientRect(); window.scrollBy(0, r.bottom - window.innerHeight + 90) }", t.element_handle()); page.wait_for_timeout(150)
        y0 = sy(); t.click(); page.wait_for_timeout(200)
        b = pop.bounding_box(); a = t.bounding_box(); vh = page.evaluate('window.innerHeight')
        check(f'[{tag}] 下端近くでは上側に出て画面内に収まる', b['y'] + b['height'] <= a['y'] + 1 and b['y'] >= 0 and b['y'] + b['height'] <= vh, json.dumps(b))
        # ウィンドウの外をタップして閉じる
        page.mouse.click(5, 300) if vw > 1000 else page.touchscreen.tap(8, 200)
        page.wait_for_timeout(150)
        check(f'[{tag}] 外側のタップで閉じ、位置も変わらない', pop.count() == 0 and sy() == y0)
        t.click(); page.wait_for_timeout(150); page.keyboard.press('Escape'); page.wait_for_timeout(120)
        check(f'[{tag}] Escキーで閉じる', pop.count() == 0 and sy() == y0)

        # --- 講義 → 比較 → 元の位置に戻る ---
        page.goto(BASE + '#/learn/clf'); page.wait_for_timeout(400)
        page.get_by_role('link', name='ストレージサービス').click(); page.wait_for_timeout(500)
        page.locator('label', has_text='Amazon EBS').first.click()          # 確認問題で選択だけしておく
        link = page.get_by_role('link', name='比べて理解する：ストレージ：S3・EBS・EFS・FSx')
        page.evaluate("(el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 300)", link.element_handle()); page.wait_for_timeout(300)
        y_lesson = sy()
        link.click(); page.wait_for_timeout(500)
        check(f'[{tag}] 移動先は先頭から表示', sy() == 0 and '#/compare/storage' in page.url)
        back = page.get_by_test_id('back').first
        check(f'[{tag}] 戻るボタンに元の画面名', 'レッスン「ストレージサービス」' in back.inner_text(), back.inner_text())
        page.get_by_role('button', name='はい').first.click(); page.wait_for_timeout(150)
        page.evaluate('window.scrollTo(0, 900)'); page.wait_for_timeout(300)
        y_compare = sy()
        page.evaluate('window.scrollTo(0, 0)'); page.wait_for_timeout(250)
        page.evaluate(f'window.scrollTo(0, {y_compare})'); page.wait_for_timeout(300)
        page.get_by_test_id('back').last.click(); page.wait_for_timeout(600)      # ページ下部の戻るボタン
        check(f'[{tag}] 戻るボタンで講義に戻る', page.url.endswith('#/learn/clf/clf-storage'), page.url)
        check(f'[{tag}] 講義の元のスクロール位置に戻る', abs(sy() - y_lesson) <= 3, f'{sy()} vs {y_lesson}')
        check(f'[{tag}] 確認問題の選択が残っている', page.locator('label', has_text='Amazon EBS').first.locator('input').is_checked())
        check(f'[{tag}] 講義に戻ったあとの戻るボタンはコース', 'CLF-C02 コース' in page.get_by_test_id('back').first.inner_text())
        page.go_forward(); page.wait_for_timeout(600)
        check(f'[{tag}] ブラウザの「進む」で比較の位置と状態が戻る', abs(sy() - y_compare) <= 3 and page.get_by_role('button', name='はい').first.get_attribute('aria-pressed') == 'true', f'{sy()} vs {y_compare}')
        page.go_back(); page.wait_for_timeout(600)
        check(f'[{tag}] ブラウザの「戻る」で講義の位置に戻る', page.url.endswith('#/learn/clf/clf-storage') and abs(sy() - y_lesson) <= 3, f'{sy()} vs {y_lesson}')
        page.reload(); page.wait_for_timeout(700)
        check(f'[{tag}] 再読み込みしても位置と選択を維持', abs(sy() - y_lesson) <= 3 and page.locator('label', has_text='Amazon EBS').first.locator('input').is_checked(), f'{sy()} vs {y_lesson}')

        # --- 解答済みの状態で関連ページへ行って戻る（解答が二重に記録されない） ---
        n0 = len(db_all('attempts'))
        page.get_by_role('button', name='解答する').click(); page.wait_for_timeout(300)
        page.locator('article a', has_text='Amazon S3').first.click(); page.wait_for_timeout(500)
        check(f'[{tag}] 解説から図鑑へ移動', '#/services/amazon-s3' in page.url and 'レッスン「ストレージサービス」' in page.get_by_test_id('back').first.inner_text())
        page.get_by_test_id('back').first.click(); page.wait_for_timeout(600)
        t2 = page.inner_text('main')
        check(f'[{tag}] 戻ると解説が表示されたまま', '不正解です' in t2 and '判断のポイント' in t2 and '次の問題へ' in t2)
        check(f'[{tag}] 解答は1回だけ記録', len(db_all('attempts')) == n0 + 1, f'{len(db_all("attempts"))} vs {n0}')

        # --- 図鑑：検索条件を維持 ---
        page.goto(BASE + '#/services'); page.wait_for_timeout(400)
        page.get_by_placeholder('サービス名で検索').fill('fsx'); page.wait_for_timeout(200)
        page.locator('main ul li a').first.click(); page.wait_for_timeout(400)
        page.get_by_role('tab', name='試験対策').click(); page.wait_for_timeout(100)
        page.get_by_test_id('back').first.click(); page.wait_for_timeout(500)
        check(f'[{tag}] 図鑑の検索条件を維持', page.get_by_placeholder('サービス名で検索').input_value() == 'fsx' and page.locator('main ul li a').count() == 1)
        page.go_forward(); page.wait_for_timeout(500)
        check(f'[{tag}] 図鑑のタブ選択を維持', page.get_by_role('tab', name='試験対策').get_attribute('aria-selected') == 'true')

        # --- 演習：出題の並びと進み具合を維持 ---
        page.goto(BASE + '#/practice'); page.wait_for_timeout(400)
        page.get_by_role('link', name='ランダム演習').click(); page.wait_for_timeout(600)
        stem = page.locator('article p').first.inner_text()
        page.locator('article label').first.click()
        if page.get_by_role('button', name='解答する').is_disabled():      # 複数選択の問題が先頭に来た場合
            page.locator('article label').nth(1).click()
        submit()
        stem1 = page.locator('article p').first.inner_text()
        page.locator('article a').first.click(); page.wait_for_timeout(500)
        page.go_back(); page.wait_for_timeout(600)
        check(f'[{tag}] 演習に戻ると同じ問題の解説が残る', page.locator('article p').first.inner_text() == stem1 == stem and '1 / 10' in page.inner_text('main') and '判断のポイント' in page.inner_text('main'))
        check(f'[{tag}] 用語ポップアップは画面移動で閉じている', pop.count() == 0)

    ux_checks('m', 390)

    # 復習日が来た状態にして、復習の流れを確認する
    page.evaluate("""() => new Promise(r => { const q = indexedDB.open('aws-master-academy'); q.onsuccess = () => { const st = q.result.transaction('reviewItems','readwrite').objectStore('reviewItems'); const g = st.getAll(); g.onsuccess = () => { const it = g.result.find(x => x.questionId === 'clf-q-storage-02'); const d = new Date(); const p = n => String(n).padStart(2,'0'); it.dueDate = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; st.put(it).onsuccess = () => r(true) } } })""")
    page.goto(BASE + '#/review'); page.wait_for_timeout(300); page.reload(); page.wait_for_timeout(500)
    page.locator('a', has_text='復習を始める').click(); page.wait_for_timeout(500)
    n_before_backup = None
    pick('S3ライフサイクルポリシー'); submit()
    rev = db_all('reviewItems')
    target = [r for r in rev if r['questionId'] == 'clf-q-storage-02']
    check('復習で正解すると次の段階へ', len(target) == 1 and target[0]['stage'] == 1, json.dumps(rev))
    page.reload(); page.wait_for_timeout(500)
    # バックアップに新しいデータが入る
    page.goto(BASE + '#/settings'); page.wait_for_timeout(500)
    with page.expect_download() as d2:
        page.get_by_role('button', name='バックアップを書き出す').click()
    dl2 = d2.value; page.wait_for_timeout(500); b2 = json.load(open(dl2.path()))['stores']
    check('バックアップに解答・進捗・復習・お気に入り', len(b2['attempts']) == len(db_all('attempts')) >= 10 and sum(1 for l in b2['lessonProgress'] if l['status'] == 'completed') == 2 and len(b2['reviewItems']) >= 1 and len(b2['favorites']) == 1 and len(b2['serviceProgress']) >= 1, str({k: len(v) for k, v in b2.items()}))
    att_before_restart = len(db_all('attempts'))
    ctx.close()

    # 再起動後もPhase 3のデータが残る
    ctx = launch(p, {'width': 390, 'height': 844}, True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.goto(BASE + '#/learn/clf'); page.wait_for_timeout(500)
    check('再起動後もレッスン進捗が残る', '2 / 21 完了' in page.inner_text('main'))
    att = page.evaluate("""() => new Promise(r => { const q = indexedDB.open('aws-master-academy'); q.onsuccess = () => { const g = q.result.transaction('attempts').objectStore('attempts').count(); g.onsuccess = () => r(g.result) } })""")
    check('再起動後も解答履歴が残る', att == att_before_restart, f'{att} vs {att_before_restart}')
    ctx.close()

    # 10. PC表示
    ctx = launch(p, {'width': 1280, 'height': 800}, False)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto(BASE); page.wait_for_timeout(500)
    check('PCでサイドバー表示', page.locator('aside').is_visible())
    check('PCで下部タブ非表示', page.evaluate("getComputedStyle(document.querySelector('nav.fixed')).display") == 'none')
    page.screenshot(path=f'{OUT}/d-home.png', full_page=True)
    page.goto(BASE + '#/settings'); page.wait_for_timeout(400); page.screenshot(path=f'{OUT}/d-settings.png', full_page=True)
    for dp in ['#/learn/clf/clf-regions-azs', '#/compare/storage', '#/services']:
        page.goto(BASE + dp); page.wait_for_timeout(400)
        w = page.evaluate('[document.documentElement.scrollWidth, window.innerWidth]'); check(f'PC横はみ出しなし {dp}', w[0] <= w[1])
        page.screenshot(path=f'{OUT}/d-{dp.replace("#/","").replace("/","-")}.png', full_page=True)
    w = page.evaluate('[document.documentElement.scrollWidth, window.innerWidth]'); check('PC横はみ出しなし', w[0] <= w[1])
    ux_checks('d', 1280)
    ctx.close()

    check('コンソールエラーなし', len(errors) == 0, str(errors[:3]))

shutil.rmtree(profile, ignore_errors=True)
fails = [r for r in results if not r[1]]
print(f'\n{len(results)-len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)
