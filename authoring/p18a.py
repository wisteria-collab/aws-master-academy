import json
C='/home/claude/aws-master-academy/content/'; D='2026-11-15'
AM=("Welcome to AWS Amplify Hosting（AWS Amplify ユーザーガイド）","https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html")
def add(o):
    if all(s['url']!=AM[1] for s in o['sources']): o['sources'].insert(0,{"title":AM[0],"url":AM[1]})
    o['verifiedAt']=D
p=C+'services/aws-amplify.json'; d=json.load(open(p)); add(d); json.dump(d,open(p,'w'),ensure_ascii=False,indent=2); open(p,'a').write('\n')
p=C+'questions/clf-batch7.json'; d=json.load(open(p))
for q in d:
    if q['id']=='clf-q-oth-09': add(q)
json.dump(d,open(p,'w'),ensure_ascii=False,indent=2); open(p,'a').write('\n')
