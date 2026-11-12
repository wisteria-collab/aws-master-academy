"""仕上げの確認：SAAの模擬試験、時間切れでの自動採点、アクセシビリティの自動検査（axe-core）。
使い方：npm run build && npx vite preview --port 4173 のあとで python3 e2e/quality.py"""
import json, sys
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:4173/'
AXE = open('node_modules/axe-core/axe.min.js').read()
results = []
def check(name, ok, detail=''):
    results.append(bool(ok)); print(('PASS' if ok else 'FAIL'), name, detail)

PAGES = ['', '#/learn', '#/learn/saa', '#/learn/clf/clf-storage', '#/learn/saa/saa-cost-network', '#/services', '#/services/amazon-s3', '#/compare', '#/compare/s3-storage-classes',
         '#/compare/nat-options/training', '#/designer', '#/designer/templates/tpl-ha-web-3tier', '#/designer/challenges/ch-ha-shop', '#/designer/challenges/ch-private-server', '#/designer/challenges/ch-dr-warm', '#/designer/challenges/ch-hybrid', '#/practice', '#/practice/run?exam=saa&mode=random',
         '#/progress', '#/review', '#/settings', '#/guide', '#/search?q=S3']

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    page = ctx.new_page(); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    # SAAの模擬試験（130分）と、時間切れでの自動採点
    page.clock.install()
    page.goto(BASE + '#/practice'); page.wait_for_timeout(600)
    page.get_by_role('button', name='SAA-C03').click(); page.wait_for_timeout(300)
    t = page.inner_text('main')
    check('SAA模擬：案内', '本番と同じ 65問・130分' in t and '合格点（720点）' in t)
    page.get_by_role('button', name='SAA-C03 の模擬試験を始める').click(); page.wait_for_timeout(800)
    t = page.inner_text('main')
    check('SAA模擬：開始', '#/exam/run/' in page.url and 'SAA-C03 模擬試験　1 / 65' in t and '残り 2:' in t, t[:60])
    page.locator('fieldset label').first.click(); page.wait_for_timeout(100)
    page.get_by_role('button', name='次の問題').click(); page.wait_for_timeout(100)
    page.clock.fast_forward('01:00:00'); page.wait_for_timeout(300)
    t = page.inner_text('main')
    check('SAA模擬：時計が進む', '残り 1:0' in t or '残り 1:1' in t, t[:60])
    page.clock.fast_forward('01:11:00'); page.wait_for_timeout(1500)
    t = page.inner_text('main')
    check('SAA模擬：時間切れで自動採点', '#/exam/result/' in page.url and '65問中' in t and '未解答 64問' in t and '制限 130分' in t and '合格点は720点' in t, page.url)
    check('SAA模擬：分野別の出題数', all(x in t for x in ['出題比率 30%・19問中', '出題比率 26%・17問中', '出題比率 24%・16問中', '出題比率 20%・13問中']))
    check('画面のエラーなし（模擬試験）', not errors, str(errors[:2]))
    ctx.close()

    # オフライン：一度開いたあとは、通信なしでも開ける
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    page = ctx.new_page(); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE); page.wait_for_timeout(500)
    ready = page.evaluate("navigator.serviceWorker.ready.then(r => new Promise(res => { const t = setInterval(() => { if (r.active && r.active.state === 'activated') { clearInterval(t); res(true) } }, 100) }))")
    page.wait_for_timeout(1500)
    n = page.evaluate("caches.keys().then(async ks => { let n = 0; for (const k of ks) n += (await (await caches.open(k)).keys()).length; return n })")
    check('オフライン：ファイルが端末に保存される', ready and n >= 10, f'{n}件')
    ctx.set_offline(True)
    page.reload(); page.wait_for_timeout(1200)
    check('オフライン：通信なしでホームが開く', '学習進捗' in page.inner_text('body'))
    page.goto(BASE + '#/designer'); page.wait_for_timeout(1000)
    check('オフライン：あとから読み込むページも開く', '構成図' in page.inner_text('main') and '読み込み中' not in page.inner_text('main'))
    page.goto(BASE + '#/services/amazon-s3'); page.wait_for_timeout(800)
    check('オフライン：教材が読める', 'Amazon S3' in page.inner_text('main'))
    check('画面のエラーなし（オフライン）', not errors, str(errors[:2]))
    ctx.set_offline(False); ctx.close()

    # アクセシビリティの自動検査
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    total = 0
    for path in PAGES:
        page.goto(BASE + path); page.wait_for_timeout(500)
        page.evaluate(AXE)
        res = page.evaluate("axe.run(document, {runOnly: ['wcag2a', 'wcag2aa']}).then(r => r.violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].html.slice(0, 160), msg: v.nodes[0].failureSummary.slice(0, 200)})))")
        bad = [v for v in res if v['impact'] in ('serious', 'critical')]
        total += len(bad)
        check(f'axe {path or "(ホーム)"}', not bad, json.dumps(bad, ensure_ascii=False)[:600] if bad else '')
    b.close()

print(f'{sum(results)}/{len(results)} passed')
sys.exit(0 if all(results) else 1)
