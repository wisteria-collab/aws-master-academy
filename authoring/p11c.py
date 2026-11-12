import json,os
R='/home/claude/aws-master-academy/content/'; D='2026-11-13'
def load(p): return json.load(open(R+p))
def save(p,d): json.dump(d,open(R+p,'w'),ensure_ascii=False,indent=2); open(R+p,'a').write('\n')
SRC=[("Configuring and managing a Multi-AZ deployment for Amazon RDS（Amazon RDS ユーザーガイド）","https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html"),
     ("Multi-AZ DB cluster deployments for Amazon RDS（Amazon RDS ユーザーガイド）","https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/multi-az-db-clusters-concepts.html"),
     ("Supported Regions and DB engines for Multi-AZ DB clusters in Amazon RDS（Amazon RDS ユーザーガイド）","https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RDS_Fea_Regions_DB-eng.Feature.MultiAZDBClusters.html"),
     ("Creating a Multi-AZ DB cluster for Amazon RDS（Amazon RDS ユーザーガイド）","https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/create-multi-az-db-cluster.html")]
def addsrc(d):
    for t,u in SRC:
        if all(s['url']!=u for s in d['sources']): d['sources'].append({"title":t,"url":u})
    d['verifiedAt']=D
d=load('comparisons/rds-ha.json')
it=[i for i in d['items'] if i['key']=='multi-az'][0]
it['label']='マルチAZ配置（DBインスタンス）'
it['values']['performance']='スタンバイは読み取りの処理をしない（Auroraを除く）。読み取りの処理能力は増えない'
it['values']['mechanism']='別のアベイラビリティゾーンに、スタンバイを1つ自動的に維持する'
new={"key":"multi-az-cluster","label":"マルチAZ DBクラスター","serviceId":"amazon-rds","oneLine":"控えにも、読む係にもなる2つのスタンバイ",
 "values":{"role":"高可用性と、読み取りの処理能力を両立する",
 "mechanism":"書き込み用のDBインスタンス1つと、読み取り用のDBインスタンス2つを、同じリージョンの3つのアベイラビリティゾーンに置く",
 "data":"半同期レプリケーション（少なくとも1つの読み取り用のDBインスタンスの確認で、変更が確定する）",
 "useCases":"高可用性が必要で、読み取りの多い処理も同じ構成で受けたいMySQLやPostgreSQLのデータベース",
 "availability":"読み取り用のDBインスタンスが、フェイルオーバーの切り替え先になる",
 "performance":"読み取り用のDBインスタンスで、読み取り専用の処理を実行できる。スタンバイが1つの構成より、書き込みの遅延が一般に小さい",
 "scalability":"2つの読み取り用のDBインスタンスで、読み取りの処理能力が増える",
 "cost":"この教材の出典には記載がないため、公式ドキュメントで確認する",
 "operations":"書き込み用のエンドポイントと、読み取り用のエンドポイントを使い分けて接続する",
 "limits":"MySQLとPostgreSQLのみ（Db2、MariaDB、Oracle、SQL Serverでは使えない）。アベイラビリティゾーンが3つ以上あるリージョンが必要。使えるDBインスタンスクラスに制限がある",
 "chooseWhen":"MySQLまたはPostgreSQLで、自動のフェイルオーバーと読み取りの分散を、1つの構成で実現したいとき",
 "avoidWhen":"MySQLとPostgreSQL以外のエンジンを使うとき。リージョン全体の障害に備えたいとき（その場合はマルチリージョン配置）"}}
if all(i['key']!='multi-az-cluster' for i in d['items']):
    idx=[i['key'] for i in d['items']].index('multi-az'); d['items'].insert(idx+1,new)
d['title']='データベースの複製：マルチAZ・マルチAZ DBクラスター・リードレプリカ・マルチリージョン'
f=d['decisionFlow']
if all(n['id']!='n3' for n in f):
    for n in f:
        if n['id']=='n2': n['no']='n3'
    f.insert(2,{"id":"n3","question":"MySQLかPostgreSQLで、高可用性に加えて、読み取りの分散も1つの構成で実現したいですか？","yes":"r-cl","no":"r-az"})
    f.append({"id":"r-cl","resultItemKey":"multi-az-cluster","note":"3つのアベイラビリティゾーンに、書き込み用1つと読み取り用2つのDBインスタンスを置きます。"})
for n in f:
    if n['id']=='r-az': n['note']='スタンバイが1つの構成です。同期のスタンバイに、自動でフェイルオーバーします。'
addsrc(d); save('comparisons/rds-ha.json',d)
d=load('lessons/saa-ha-ft.json')
a='・マルチAZ配置：別のアベイラビリティゾーンに、同期のスタンバイを自動的に維持します。'
b=a+'スタンバイが1つのこの構成（マルチAZ DBインスタンス配置）では、スタンバイは読み取りの処理をしません。MySQLとPostgreSQLでは、3つのアベイラビリティゾーンに書き込み用1つと読み取り用2つのDBインスタンスを置く「マルチAZ DBクラスター配置」も選べます。読み取り用のDBインスタンスは、フェイルオーバーにも、読み取りの処理にも使えます。'
if b not in d['mechanism']['text']:
    assert a in d['mechanism']['text']; d['mechanism']['text']=d['mechanism']['text'].replace(a,b)
pt='マルチAZ DBクラスター＝MySQLとPostgreSQLで、3つのアベイラビリティゾーンに書き込み用1つ＋読み取り用2つ。高可用性と読み取りの分散を両立。'
if pt not in d['examPoints']: d['examPoints'].append(pt)
addsrc(d); save('lessons/saa-ha-ft.json',d)
d=load('services/amazon-rds.json')
pt='マルチAZには、スタンバイが1つの「DBインスタンス配置」（スタンバイは読み取り不可）と、スタンバイが2つの「DBクラスター配置」（MySQLとPostgreSQL、読み取りにも使える）がある。'
if pt not in d['exam']['points']: d['exam']['points'].append(pt)
addsrc(d); save('services/amazon-rds.json',d)
print('ok')
