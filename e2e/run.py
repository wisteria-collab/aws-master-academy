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

PAGES = ['', '#/learn', '#/learn/clf', '#/learn/saa', '#/services', '#/compare', '#/designer', '#/practice', '#/progress', '#/review', '#/settings', '#/nope']

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
        small = page.evaluate('''() => [...document.querySelectorAll('main *, nav *')].filter(e => e.children.length===0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 14).map(e => e.textContent.trim().slice(0,20))''')
        check(f'文字14px以上 {path or "/"}', len(small) == 0, str(small[:3]))
        page.screenshot(path=f'{OUT}/m-{(path or "home").replace("#/","").replace("/","-")}.png', full_page=True)

    page.goto(BASE); page.wait_for_timeout(300)
    body = page.inner_text('body')
    for word in ['学習進捗', 'CLF学習', 'SAA学習', 'サービス図鑑', '類似サービス比較', '構成図シミュレーター', '問題演習', '苦手分野・復習', 'AWS非公式']:
        check(f'ホームに「{word}」', word in body)
    check('架空の進捗を出していない', '教材を準備中です' in body and '0分' in body)

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
    check('学習時間が記録された', '学習時間の記録\n1件' in t or '学習時間の記録1件' in t.replace('\n',''), '')
    secs = page.evaluate('''() => new Promise(r => { const q = indexedDB.open('aws-master-academy'); q.onsuccess = () => { const g = q.result.transaction('studySessions').objectStore('studySessions').getAll(); g.onsuccess = () => r(g.result) } })''')
    check('記録秒数が妥当(10〜25秒)', len(secs) == 1 and 10 <= secs[0]['seconds'] <= 25 and secs[0]['feature'] == 'learn', json.dumps(secs))
    before = secs[0]['seconds']
    ctx.close()

    # 4. ブラウザを閉じて開き直しても残る
    ctx = launch(p, {'width': 390, 'height': 844}, True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '#/settings'); page.wait_for_timeout(600)
    secs2 = page.evaluate('''() => new Promise(r => { const q = indexedDB.open('aws-master-academy'); q.onsuccess = () => { const g = q.result.transaction('studySessions').objectStore('studySessions').getAll(); g.onsuccess = () => r(g.result) } })''')
    check('再起動後もデータが残る', len(secs2) == 1 and secs2[0]['seconds'] == before, json.dumps(secs2))

    # 設定（文字サイズ）が LocalStorage に残る
    page.get_by_role('button', name='大きめ').click(); page.wait_for_timeout(100)
    check('文字サイズ変更', page.evaluate('getComputedStyle(document.documentElement).fontSize') == '18px')

    # 5. バックアップ書き出し
    with page.expect_download() as d:
        page.get_by_role('button', name='バックアップを書き出す').click()
    dl = d.value; path = '/home/claude/e2e/backup.json'; dl.save_as(path)
    data = json.load(open(path))
    check('書き出しファイル名', dl.suggested_filename.startswith('aws-master-academy-backup-') and dl.suggested_filename.endswith('.json'), dl.suggested_filename)
    check('書き出し内容', data['app'] == 'aws-master-academy' and data['schemaVersion'] == 1 and len(data['stores']['studySessions']) == 1)
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
    check('読み込み前に件数を表示', '合計 1 件' in page.inner_text('main'))
    page.screenshot(path=f'{OUT}/m-settings-import.png', full_page=True)
    page.get_by_role('button', name='今のデータに統合する').click(); page.wait_for_timeout(500)
    secs3 = page.evaluate('''() => new Promise(r => { const q = indexedDB.open('aws-master-academy'); q.onsuccess = () => { const g = q.result.transaction('studySessions').objectStore('studySessions').getAll(); g.onsuccess = () => r(g.result) } })''')
    check('バックアップから復元', len(secs3) == 1 and secs3[0]['seconds'] == before, json.dumps(secs3))

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
    ctx.close()

    # 10. PC表示
    ctx = launch(p, {'width': 1280, 'height': 800}, False)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto(BASE); page.wait_for_timeout(500)
    check('PCでサイドバー表示', page.locator('aside').is_visible())
    check('PCで下部タブ非表示', page.evaluate("getComputedStyle(document.querySelector('nav.fixed')).display") == 'none')
    page.screenshot(path=f'{OUT}/d-home.png', full_page=True)
    page.goto(BASE + '#/settings'); page.wait_for_timeout(400); page.screenshot(path=f'{OUT}/d-settings.png', full_page=True)
    w = page.evaluate('[document.documentElement.scrollWidth, window.innerWidth]'); check('PC横はみ出しなし', w[0] <= w[1])
    ctx.close()

    check('コンソールエラーなし', len(errors) == 0, str(errors[:3]))

shutil.rmtree(profile, ignore_errors=True)
fails = [r for r in results if not r[1]]
print(f'\n{len(results)-len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)
