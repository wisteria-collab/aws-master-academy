from p4common import *
import json,os
D2='2026-11-13'
MA={"title":"Configuring and managing a Multi-AZ deployment for Amazon RDS（Amazon RDS ユーザーガイド）","url":"https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html"}
MC={"title":"Multi-AZ DB cluster deployments for Amazon RDS（Amazon RDS ユーザーガイド）","url":"https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/multi-az-db-clusters-concepts.html"}
MR={"title":"Supported Regions and DB engines for Multi-AZ DB clusters in Amazon RDS（Amazon RDS ユーザーガイド）","url":"https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RDS_Fea_Regions_DB-eng.Feature.MultiAZDBClusters.html"}
MK={"title":"Creating a Multi-AZ DB cluster for Amazon RDS（Amazon RDS ユーザーガイド）","url":"https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/create-multi-az-db-cluster.html"}
GE={"title":"Gateway endpoints（AWS PrivateLink ガイド）","url":"https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html"}
NB={"title":"NAT gateway basics（Amazon VPC ユーザーガイド）","url":"https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html"}
NC={"title":"Compare NAT gateways and NAT instances（Amazon VPC ユーザーガイド）","url":"https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-comparison.html"}
def A(id,task,stem,right,rexp,wrongs,kw,point,srcs,rel,svs):
    d=SQ(id,task,"advanced",stem,right,rexp,wrongs,kw,point,srcs,rel,svs,"scenario"); d['verifiedAt']=D2; return d
qs=[
 A("saa-q-maz-cl-01","saa-2-2","ある企業は、Amazon RDS for PostgreSQLで業務システムを動かしています。要件は3つです。1つのアベイラビリティゾーンに障害が起きても、自動で切り替わって使い続けられること。読み取りの処理を、書き込み用とは別のDBインスタンスに分散できること。書き込みの遅延を、スタンバイが1つの構成より小さくしたいこと。最も適切な構成はどれですか。",
  "マルチAZ DBクラスター配置にする","マルチAZ DBクラスター配置は、書き込み用のDBインスタンスと、読み取り用の2つのDBインスタンスを、3つのアベイラビリティゾーンに置く高可用性の構成です。読み取り用のDBインスタンスは、フェイルオーバーに使えるうえ、読み取りの処理もできます。スタンバイが1つのマルチAZ DBインスタンス配置より、書き込みの遅延が一般に小さくなります。",
  [("マルチAZ DBインスタンス配置にする","自動で切り替わる要件は満たしますが、スタンバイは読み取りの処理をしません。読み取りを別のDBインスタンスに分散できること、という要件を満たせません。","読み取りの処理を、書き込み用とは別のDBインスタンスに分散できること"),
   ("1つのアベイラビリティゾーンのDBインスタンスに、同じアベイラビリティゾーンのリードレプリカを2つ追加する","読み取りは分散できますが、すべてが同じアベイラビリティゾーンにあるため、そのゾーンの障害で使えなくなります。リードレプリカの昇格も手動です。","1つのアベイラビリティゾーンに障害が起きても、自動で切り替わって"),
   ("DBインスタンスを、より大きなインスタンスクラスに変更する","1台のままなので、そのアベイラビリティゾーンの障害で止まります。読み取りを別のDBインスタンスに分散することもできません。","1つのアベイラビリティゾーンに障害が起きても、自動で切り替わって")],
  ["1つのアベイラビリティゾーンに障害が起きても、自動で切り替わって","読み取りの処理を、書き込み用とは別のDBインスタンスに分散できること","書き込みの遅延"],"高可用性＋読み取りの分散＋書き込みの遅延を小さく＝マルチAZ DBクラスター配置（MySQLとPostgreSQL）。",[MA,MC,MR,SG],[L("saa-ha-ft"),C("rds-ha")],["amazon-rds"]),
 A("saa-q-maz-cl-02","saa-2-2","ある企業は、Amazon RDS for MySQLで、マルチAZ DBクラスターを作成しようとしています。使っているDBサブネットグループには、2つのアベイラビリティゾーンのサブネットしか含まれていません。リージョンには、アベイラビリティゾーンが3つ以上あります。クラスターを作成するために、必要な対応はどれですか。",
  "3つ目のアベイラビリティゾーンのサブネットを、DBサブネットグループに追加する","マルチAZ DBクラスターは、書き込み用と読み取り用の3つのDBインスタンスを、それぞれ別のアベイラビリティゾーンに置きます。そのため、DBサブネットグループは、少なくとも3つのアベイラビリティゾーンをカバーする必要があります。",
  [("マルチAZ DBインスタンス配置に変更する","スタンバイが1つの構成なら2つのアベイラビリティゾーンで作れますが、作りたいのはマルチAZ DBクラスターです。目的の構成を、別の構成に置き換える対応になってしまいます。","マルチAZ DBクラスターを作成しようとしています"),
   ("データベースのエンジンを、MariaDBに変更する","マルチAZ DBクラスターは、MySQLとPostgreSQLで使えます。MariaDBでは使えないため、解決になりません。","Amazon RDS for MySQLで"),
   ("DBインスタンスを、より大きなインスタンスクラスに変更する","問題は、サブネットがカバーするアベイラビリティゾーンの数です。インスタンスクラスを変えても解決しません。","2つのアベイラビリティゾーンのサブネットしか含まれていません")],
  ["マルチAZ DBクラスター","2つのアベイラビリティゾーンのサブネットしか含まれていません"],"マルチAZ DBクラスター＝3つのDBインスタンスを別々のアベイラビリティゾーンに置く。DBサブネットグループも3つのゾーンが必要。",[MK,MR,SG],[L("saa-ha-ft"),C("rds-ha")],["amazon-rds"]),
 A("saa-q-nat-gwe-01","saa-4-4","ある企業の本番環境は、3つのアベイラビリティゾーンのプライベートサブネットにEC2インスタンスを置いています。インスタンスは、外部のAPIを呼び出すためにインターネットへアクセスし、また、大量のデータをAmazon S3に保存しています。現在は、1つのアベイラビリティゾーンにだけNATゲートウェイを置き、S3への通信もすべてそのNATゲートウェイを通しています。1つのアベイラビリティゾーンの障害でインターネットへのアクセスが止まらないようにし、あわせて、NATゲートウェイを通るデータの量に応じた料金を減らしたいと考えています。最も適切な組み合わせはどれですか。",
  "各アベイラビリティゾーンにNATゲートウェイを置き、さらにS3のゲートウェイエンドポイントを作成してS3への通信をそちらに向ける","NATゲートウェイは、作成したアベイラビリティゾーンに属します。各ゾーンに置けば、1つのゾーンの障害がほかのゾーンのインターネットへのアクセスに広がりません。S3への通信は、追加の料金がかからないゲートウェイエンドポイントに向けることで、NATゲートウェイを通るデータを減らせます。",
  [("1つのNATゲートウェイのまま、S3のゲートウェイエンドポイントだけを作成する","NATゲートウェイを通るデータの量は減りますが、NATゲートウェイのあるアベイラビリティゾーンが止まると、ほかのゾーンのインスタンスもインターネットにアクセスできなくなります。","1つのアベイラビリティゾーンの障害でインターネットへのアクセスが止まらないように"),
   ("各アベイラビリティゾーンにNATゲートウェイを置き、S3への通信も引き続きNATゲートウェイを通す","障害には強くなりますが、S3への大量のデータは引き続きNATゲートウェイを通るため、データの量に応じた料金は減りません。","NATゲートウェイを通るデータの量に応じた料金を減らしたい"),
   ("NATゲートウェイをNATインスタンス1台に置き換える","NATインスタンス1台は単一障害点になり、フェイルオーバーも利用者がスクリプトなどで管理する必要があります。障害への備えという要件に合いません。","1つのアベイラビリティゾーンの障害でインターネットへのアクセスが止まらないように")],
  ["1つのアベイラビリティゾーンの障害でインターネットへのアクセスが止まらないように","NATゲートウェイを通るデータの量に応じた料金を減らしたい"],"回復力＝NATゲートウェイを各ゾーンに。コスト＝S3・DynamoDBへはゲートウェイエンドポイント。2つの要件を別々の手段で満たす。",[NB,NC,GE,SG],[L("saa-cost-network"),C("nat-options")],["amazon-vpc","amazon-s3"]),
]
check_qs(qs); w('questions/saa-p11b.json',qs)
for les,ids in [('saa-ha-ft',['saa-q-maz-cl-01','saa-q-maz-cl-02']),('saa-cost-network',['saa-q-nat-gwe-01'])]:
    p=os.path.join(ROOT,'lessons',les+'.json'); d=json.load(open(p))
    for i in ids:
        if i not in d['quizQuestionIds']: d['quizQuestionIds'].append(i)
    json.dump(d,open(p,'w'),ensure_ascii=False,indent=2)
print('ok')
