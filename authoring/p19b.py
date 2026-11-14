import json,glob
C='/home/claude/aws-master-academy/content/'; D='2026-11-15'; A='https://aws.amazon.com/'
U={'rs':("Amazon Redshift FAQs（AWS公式）",A+"redshift/faqs/"),'efs':("Amazon EFS のよくある質問（AWS公式）",A+"jp/efs/faq/"),
'bat':("AWS Batch FAQs（AWS公式）",A+"batch/faqs/"),'kds':("Amazon Kinesis Data Streams FAQs（AWS公式）",A+"kinesis/data-streams/faqs/")}
M={'saa-q-pd-03':'rs','saa-q-ps-01':'efs','saa-q-pc-02':'bat','saa-q-di-03':'kds'}
OLD="データはミリ秒単位で利用できるようになり、リアルタイムのダッシュボードや異常検知に使えます。"
NEW="拡張ファンアウトを使うと、新しいデータは通常70ミリ秒以内に利用者のプログラムへ届きます。リアルタイムの指標の算出や分析に使えます。"
n=0
for f in glob.glob(C+'questions/saa-*.json'):
    d=json.load(open(f)); ch=False
    for q in d:
        if q['id'] in M:
            t,u=U[M[q['id']]]
            if all(s['url']!=u for s in q['sources']): q['sources'].insert(0,{"title":t,"url":u})
            if q['id']=='saa-q-di-03':
                for c in q['choices']:
                    if c.get('correct'): assert OLD in c['explanation']; c['explanation']=c['explanation'].replace(OLD,NEW)
            q['verifiedAt']=D; ch=True; n+=1
    if ch: json.dump(d,open(f,'w'),ensure_ascii=False,indent=2); open(f,'a').write('\n')
print(n)
