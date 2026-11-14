import json
C='/home/claude/aws-master-academy/content/'; D='2026-11-14'
def ld(p): return json.load(open(C+p))
def sv(p,d): json.dump(d,open(C+p,'w'),ensure_ascii=False,indent=2); open(C+p,'a').write('\n')
def addsrc(o,t,u):
    if all(s['url']!=u for s in o['sources']): o['sources'].insert(0,{"title":t,"url":u})
# CloudTrail: イベントの中身（ID・時刻・IP）の根拠
CT=("CloudTrail record contents（AWS CloudTrail ユーザーガイド）","https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-record-contents.html")
for p in ['questions/clf-batch4.json','questions/clf-batch2.json','questions/clf-batch1.json','questions/clf-batch3.json']:
    try: d=ld(p)
    except FileNotFoundError: continue
    hit=False
    for q in d:
        if q['id']=='clf-q-gov-02': addsrc(q,*CT); q['verifiedAt']=D; hit=True
    if hit: sv(p,d); print('gov-02 in',p)
# Timestream: LiveAnalyticsの新規受付の終了
TS=("Document history（Amazon Timestream デベロッパーガイド）","https://docs.aws.amazon.com/timestream/latest/developerguide/doc-history.html")
p='questions/saa-p4f.json'; d=ld(p)
for q in d:
    if q['id']=='saa-q-cd-06':
        for c in q['choices']:
            if c.get('correct'):
                c['explanation']+="なお、Timestream for LiveAnalyticsは2025年6月20日から新しい利用者を受け付けていません。AWSは似た機能として、Timestream for InfluxDBを案内しています。"
        addsrc(q,*TS); q['verifiedAt']=D
sv(p,d)
# Connect: 名前の変更の日付と根拠
CN=("AWS Weekly Roundup（2026年5月4日・AWS公式ブログ）","https://aws.amazon.com/blogs/aws/aws-weekly-roundup-whats-next-with-aws-2026-amazon-quick-openai-partnership-and-more-may-4-2026/")
p='services/amazon-connect.json'; d=ld(p)
d['uncertainNote']="試験ガイド（バージョン1.3）ではAmazon Connectと書かれています。AWSは2026年5月に、Amazon Connectを4つのAIソリューションのまとまりに広げ、これまでの製品を「Amazon Connect Customer」と呼ぶようになりました。このアプリは試験ガイドの名前に合わせています。"
addsrc(d,*CN); d['verifiedAt']=D; sv(p,d)
# Security Hub: CSPMの表記の根拠
SH=("AWS Security Hub is expanding to unify security operations across multicloud environments（2026年3月10日・AWS公式ブログ）","https://aws.amazon.com/blogs/security/aws-security-hub-is-expanding-to-unify-security-operations-across-multicloud-environments/")
p='services/aws-security-hub.json'; d=ld(p); addsrc(d,*SH); d['verifiedAt']=D; sv(p,d)
