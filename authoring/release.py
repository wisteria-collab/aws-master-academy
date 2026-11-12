#!/usr/bin/env python3
"""Phase 4 の各回の仕上げ: 件数に合わせて e2e・README・バージョンを更新する。
使い方: release.py <version> <phase label> [追加で巡回するページ...]"""
import json, glob, re, sys, os
R='/home/claude/aws-master-academy'; os.chdir(R)
ver, label, pages = sys.argv[1], sys.argv[2], sys.argv[3:]
n=lambda k: len(glob.glob(f'content/{k}/*.json'))
les=[json.load(open(f)) for f in glob.glob('content/lessons/*.json')]
clf=sum(1 for l in les if l['course']=='clf'); saa=len(les)-clf
qs=[x for f in glob.glob('content/questions/*.json') for x in json.load(open(f))]
qc=sum(1 for x in qs if x['exam']=='clf'); svc=n('services'); cmp_=n('comparisons')
p='e2e/run.py'; s=open(p).read()
s=re.sub(r'図鑑に\d+サービス',f'図鑑に{svc}サービス',s); s=re.sub(r"count\(\) == \d+\)(?=\n    page.get_by_placeholder)",f"count() == {svc})",s)
s=re.sub(r"'0 / \d+' in body and '正答率'",f"'0 / {saa}' in body and '正答率'",s)
if pages:
    anchor="'#/learn/saa/saa-data-security',"
    assert anchor in s
    add=' '.join(f"'{x}'," for x in pages if f"'{x}'" not in s)
    s=s.replace(anchor,anchor+(' '+add if add else ''))
    m=re.search(r'10〜(\d+)秒',s); new=int(m.group(1))+3*len(pages)
    s=s.replace(f'10〜{m.group(1)}秒',f'10〜{new}秒').replace(f'<= {m.group(1)},',f'<= {new},')
open(p,'w').write(s)
p='src/config/app.ts'; s=open(p).read()
s=re.sub(r"version: '[\d.]+'",f"version: '{ver}'",s); s=re.sub(r"phase: 'Phase[^']*'",f"phase: '{label}'",s,count=1); open(p,'w').write(s)
p='package.json'; s=open(p).read(); s=re.sub(r'"version": "[\d.]+"',f'"version": "{ver}"',s,count=1); open(p,'w').write(s)
p='README.md'; s=open(p).read()
s=re.sub(r'\*\*Phase [^*]*\*\*（[^）]*）',f'**{label.split("（")[0]}**（CLFのレッスン{clf}本、SAAのレッスン{saa}本、サービス{svc}件、比較グループ{cmp_}件、問題{len(qs)}問）',s,count=1); open(p,'w').write(s)
print(f'clf lessons {clf}, saa lessons {saa}, services {svc}, comparisons {cmp_}, questions clf {qc} / saa {len(qs)-qc}')
