import json
R='/home/claude/aws-master-academy/content/comparisons/'; D='2026-11-13'
S={'gp':("Amazon EBS General Purpose SSD volumes（Amazon EBS ユーザーガイド）","https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html"),
'kf':("Amazon Kinesis Data Streams FAQs（AWS公式）","https://aws.amazon.com/kinesis/data-streams/faqs/"),
'rr':("Working with DB instance read replicas（Amazon RDS ユーザーガイド）","https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html"),
'rf':("Amazon RDS FAQs（AWS公式）","https://aws.amazon.com/rds/faqs/"),
'tw':("How AWS Transit Gateway works（Amazon VPC Transit Gateways）","https://docs.aws.amazon.com/vpc/latest/tgw/how-transit-gateways-work.html"),
'tf':("What is AWS Transfer Family?（AWS Transfer Family ユーザーガイド）","https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html")}
C={('ebs-volume-types','汎用SSD（gp3）','operations'):("IOPSとスループットを、容量とは別に設定できる。性能を上げるために、容量を増やす必要はない。容量・種類・IOPS・スループットは、Elastic Volumesで変更できる",['gp']),
('messaging','Amazon Kinesis','availability'):("データを、リージョン内の3つのアベイラビリティゾーンに同期して複製し、高い可用性と耐久性を持つ",['kf']),
('rds-ha','リードレプリカ','cost'):("通常のDBインスタンスと同じ料金で課金される（料金はリードレプリカのDBインスタンスクラスで決まる）。同じリージョン内での複製のデータ転送には課金されない。金額は公式の料金ページで確認する",['rr','rf']),
('vpc-connectivity','AWS Transit Gateway','availability'):("VPCを接続するときは、アベイラビリティゾーンごとにサブネットを1つ指定して使えるようにする。可用性のために、複数のアベイラビリティゾーンを有効にすることが推奨されている",['tw']),
('data-transfer','AWS Transfer Family','performance'):("公式の説明に、遅延やスループットの数値の記載はない。接続と転送のリクエストは、自動でスケールする冗長な仕組みで処理される",['tf'])}
n=0
for cid in {k[0] for k in C}:
    p=R+cid+'.json'; d=json.load(open(p)); used=set()
    for it in d['items']:
        for (c,label,ax),(v,ss) in C.items():
            if c==cid and it['label']==label:
                assert it['values'][ax].startswith('この教材の出典'),(cid,label,ax); it['values'][ax]=v; n+=1; used|=set(ss)
    for k in used:
        t,u=S[k]
        if all(s['url']!=u for s in d['sources']): d['sources'].append({"title":t,"url":u})
    d['verifiedAt']=D; json.dump(d,open(p,'w'),ensure_ascii=False,indent=2); open(p,'a').write('\n')
print('filled',n)
