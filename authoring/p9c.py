from p4common import *
D2='2026-11-12'
TH={"title":"Throttle requests to your REST APIs for better throughput in API Gateway（Amazon API Gateway デベロッパーガイド）","url":"https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html"}
UP={"title":"Usage plans and API keys for REST APIs in API Gateway（Amazon API Gateway デベロッパーガイド）","url":"https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html"}
EV={"title":"Modify an Amazon EBS volume using Elastic Volumes operations（Amazon EBS ユーザーガイド）","url":"https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html"}
PI={"title":"Access an AWS service using an interface VPC endpoint（AWS PrivateLink ガイド）","url":"https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html"}
PG={"title":"Guidance for Network Connectivity on AWS（AWS公式）","url":"https://docs.aws.amazon.com/solutions/network-connectivity-on-aws/"}
OP={"title":"Billing and pricing for AWS Organizations（AWS Organizations ユーザーガイド）","url":"https://docs.aws.amazon.com/organizations/latest/userguide/pricing.html"}
IF={"title":"AWS Identity and Access Management (IAM) FAQs（AWS公式）","url":"https://aws.amazon.com/iam/faqs/"}
HD={"title":"What is AWS Health?（AWS Health ユーザーガイド）","url":"https://docs.aws.amazon.com/health/latest/ug/what-is-aws-health.html"}
def Q(id,task,stem,right,rexp,wrongs,kw,point,srcs,les,svs=[]):
    d=SQ(id,task,"standard",stem,right,rexp,wrongs,kw,point,srcs,[L(les)],svs,"scenario"); d['verifiedAt']=D2; return d
saa=[
 Q("saa-q-thr-01","saa-2-1","ある企業は、Amazon API Gatewayで公開しているAPIを運用しています。一部の利用者から短時間に大量のリクエストが送られ、背後のシステムが処理しきれなくなることがありました。背後のシステムを守るために、受け付けるリクエストの量に上限を設けたいと考えています。上限を超えたリクエストは、エラーとして断ってかまいません。どの機能を使えばよいですか。",
  "API Gatewayのスロットリングを設定する","スロットリングは、1秒あたりのリクエスト数とバーストに上限を設け、超えた分を429 Too Many Requestsのエラーで断る機能です。背後のシステムが、大量のリクエストで押しつぶされるのを防げます。",
  [("API Gatewayのキャッシュを有効にする","キャッシュは、同じ応答を保存して使い回し、背後への呼び出しを減らす機能です。受け付けるリクエストの量に上限を設けるものではありません。","受け付けるリクエストの量に上限を設けたい"),
   ("Amazon CloudWatchのアラームを作成する","アラームは、指標がしきい値を超えたことを通知する機能です。状況を知ることはできますが、リクエストを断ることはできません。","上限を超えたリクエストは、エラーとして断って"),
   ("背後のシステムをマルチAZ配置にする","マルチAZ配置は、アベイラビリティゾーンの障害に備える方法です。大量のリクエストを断って、システムを守る仕組みではありません。","受け付けるリクエストの量に上限を設けたい")],
  ["受け付けるリクエストの量に上限を設けたい","上限を超えたリクエストは、エラーとして断って"],"リクエストの量に上限を設けて守る＝スロットリング。API Gatewayは超えた分を429エラーで断る。",[TH,SG],"saa-ha-ft",["amazon-api-gateway"]),
 Q("saa-q-thr-02","saa-2-1","ある企業は、Amazon API GatewayのREST APIを、複数の取引先に提供しています。取引先ごとにAPIキーを発行しています。ある取引先のプログラムの不具合で大量のリクエストが届き、ほかの取引先の利用に影響が出ました。取引先ごとに、リクエストの上限を設定したいと考えています。どの方法が適切ですか。",
  "使用量プランを作成し、取引先のAPIキーと関連付ける","使用量プランは、APIキーでクライアントを見分け、キーごとにスロットリングの上限と、一定期間のリクエスト数の上限（クォータ）を設定できます。取引先ごとに上限を分けられます。",
  [("アカウント全体のスロットリングの上限の引き上げを申請する","アカウント全体の上限は、そのリージョンのすべてのAPIに共通で適用されます。引き上げても、取引先ごとに上限を分けることはできません。","取引先ごとに、リクエストの上限を設定したい"),
   ("APIを、取引先の数だけ別のリージョンにデプロイする","リージョンを分けると、管理するものが増えます。取引先ごとの上限は、APIキーと使用量プランで設定でき、リージョンを分ける必要はありません。","取引先ごとにAPIキーを発行しています"),
   ("AWS Budgetsで、取引先ごとの予算を設定する","AWS Budgetsは、費用や使用量が予算を超えそうなときに通知するサービスです。APIへのリクエストを絞ることはできません。","取引先ごとに、リクエストの上限を設定したい")],
  ["取引先ごとにAPIキーを発行しています","取引先ごとに、リクエストの上限を設定したい"],"クライアントごとの上限＝使用量プラン＋APIキー。",[UP,TH,SG],"saa-ha-ft",["amazon-api-gateway"]),
 Q("saa-q-ebs-ev-01","saa-3-1","ある企業は、Amazon EC2インスタンスにgp3のAmazon EBSボリュームをアタッチして、業務アプリケーションを動かしています。データが増え、ボリュームの空きが少なくなってきました。インスタンスはElastic Volumesに対応しています。アプリケーションを止めずに、容量を増やしたいと考えています。どの方法が適切ですか。",
  "Elastic Volumesの操作で、ボリュームのサイズを増やす","Elastic Volumesを使うと、対応するインスタンスでは、ボリュームをデタッチしたりインスタンスを再起動したりせずに、サイズの拡張、種類の変更、性能の調整ができます。変更の間も、アプリケーションを使い続けられます。",
  [("インスタンスを停止し、スナップショットから大きいボリュームを作り直して付け替える","この方法でも容量は増やせますが、インスタンスを停止する必要があります。Elastic Volumesに対応していれば、止めずにサイズを増やせます。","アプリケーションを止めずに"),
   ("インスタンスストアのボリュームを追加する","インスタンスストアは、インスタンスの停止などでデータが消える一時的なストレージです。業務データを置き続ける場所の拡張には向きません。","データが増え"),
   ("ボリュームの種類をコールドHDD（sc1）に変更する","種類を変えても、容量は増えません。sc1はアクセスの少ないデータ向けの低コストなHDDで、空きが少ないという問題は解決しません。","ボリュームの空きが少なくなってきました")],
  ["Elastic Volumesに対応しています","アプリケーションを止めずに"],"EBSは、Elastic Volumesでデタッチも再起動もせずに、サイズ・種類・性能を変更できる。",[EV,SG],"saa-perf-storage",["amazon-ebs"]),
 Q("saa-q-vpce-ha-01","saa-2-2","ある企業は、VPC内のプライベートサブネットにあるアプリケーションから、インターフェイスVPCエンドポイントを通して、AWSのサービスに接続しています。アプリケーションは、2つのアベイラビリティゾーンに配置しています。エンドポイントは、1つのサブネットにだけ作成しました。1つのアベイラビリティゾーンに障害が起きても、接続を続けられるようにしたいと考えています。どうすればよいですか。",
  "エンドポイントに、複数のアベイラビリティゾーンのサブネットを指定する","インターフェイスエンドポイントは、指定したサブネットごとに、エンドポイント用のネットワークインターフェイスを作ります。複数のアベイラビリティゾーンのサブネットを選ぶことで、高可用性を実現できます。",
  [("同じサブネットに、エンドポイントのネットワークインターフェイスを2つ作る","1つのアベイラビリティゾーンにつき、選べるサブネットは1つです。同じ場所に増やしても、そのアベイラビリティゾーンの障害には備えられません。","1つのアベイラビリティゾーンに障害が起きても"),
   ("エンドポイントを削除し、NATゲートウェイを1つ作成する","NATゲートウェイを1つだけ作っても、そのアベイラビリティゾーンの障害の影響を受けます。また、通信がエンドポイントを通らなくなります。","インターフェイスVPCエンドポイントを通して"),
   ("エンドポイントのセキュリティグループで、すべての通信を許可する","セキュリティグループは、通信を許可するかどうかを決める仕組みです。許可を広げても、アベイラビリティゾーンの障害には備えられません。","1つのアベイラビリティゾーンに障害が起きても")],
  ["1つのサブネットにだけ作成しました","1つのアベイラビリティゾーンに障害が起きても"],"インターフェイスエンドポイントの高可用性＝複数のアベイラビリティゾーンのサブネットを選ぶ。",[PI,PG,SG],"saa-ha-ft",["amazon-vpc"]),
]
check_qs(saa); w('questions/saa-p9c.json',saa)
CG=[{"exam":"clf","version":"1.3"}]
def CQ(id,dom,task,stem,right,rexp,wrongs,kw,point,srcs,les,svs):
    d=q(id,dom,task,"basic","single","basic",stem,[(right,True,rexp,None)]+[(t,False,e,el) for t,e,el in wrongs],kw,point,srcs,svs,[L(les)]); d['verifiedAt']=D2; d['basedOnGuide']=CG; return d
clf=[
 CQ("clf-q-org-cost-01","clf-d4","clf-4-2","ある企業は、部門ごとに作った複数のAWSアカウントを、AWS Organizationsでまとめて管理することを検討しています。経理の担当者から、「AWS Organizationsを使うこと自体に、料金はかかるのか」と質問されました。どの説明が正しいですか。",
  "追加料金なしで利用でき、課金されるのはメンバーアカウントで使ったAWSリソースの分だけである","AWS Organizationsは、追加料金なしで提供されています。課金されるのは、メンバーアカウントのユーザーやロールが使ったAWSリソースの分だけです。",
  [("管理するアカウントの数に応じて、月額の料金がかかる","AWS Organizationsは、追加料金なしで提供されています。アカウントの数に応じた料金はありません。","AWS Organizationsを使うこと自体に、料金はかかるのか"),
   ("AWSサポートの有料プランを契約しているアカウントだけが利用できる","AWS Organizationsは、追加料金なしで提供されています。利用に、有料のサポートプランの契約は必要ありません。","AWS Organizationsを使うこと自体に、料金はかかるのか"),
   ("組織を作成するときに、初期費用を一度だけ支払う","AWS Organizationsに、初期費用はありません。追加料金なしで利用できます。","AWS Organizationsを使うこと自体に、料金はかかるのか")],
  ["AWS Organizationsを使うこと自体に、料金はかかるのか"],"AWS Organizations＝追加料金なし。払うのは、各アカウントで使ったリソースの分。",[OP],"clf-billing-cost",["aws-organizations"]),
 CQ("clf-q-iam-cost-01","clf-d2","clf-2-3","ある企業の管理者は、担当者ごとにIAMユーザーを作成し、役割に合わせたIAMポリシーを設定しようとしています。上司から、「ユーザーやポリシーを増やすと、IAMの利用料金が増えるのではないか」と質問されました。どの説明が正しいですか。",
  "IAMは、追加料金なしで利用できる","IAMは、追加料金なしで提供されています。ユーザー、グループ、ロール、ポリシーを作ること自体に、料金はかかりません。",
  [("IAMユーザー1人ごとに、月額の料金がかかる","IAMは、追加料金なしで提供されています。ユーザーの数に応じた料金はありません。","IAMの利用料金が増えるのではないか"),
   ("IAMポリシーを評価した回数に応じて、料金がかかる","IAMは、追加料金なしで提供されています。ポリシーの評価の回数に応じた料金はありません。","IAMの利用料金が増えるのではないか"),
   ("最初の12か月だけ無料で、その後は料金がかかる","IAMは、期間の制限なく、追加料金なしで利用できます。","IAMの利用料金が増えるのではないか")],
  ["IAMの利用料金が増えるのではないか"],"IAM＝追加料金なし。必要なだけユーザーやロールを分け、最小権限にする。",[IF],"clf-iam",["aws-iam"]),
 CQ("clf-q-health-cost-01","clf-d4","clf-4-3","ある企業は、無料のベーシックサポートのまま、AWSを利用しています。運用の担当者は、自社のアカウントのリソースに影響するAWS側の障害や、予定されているメンテナンスの情報を確認したいと考えています。追加の費用はかけたくありません。どれを使えばよいですか。",
  "AWS Health Dashboard","AWS Health Dashboardは、すべてのAWSの利用者が、追加料金なしで利用できます。自分のアカウントやリソースに影響するイベントや、予定されている変更を確認できます。",
  [("AWS Artifact","AWS Artifactは、AWSのコンプライアンスレポートや契約を入手するためのサービスです。障害やメンテナンスの情報を確認するものではありません。","障害や、予定されているメンテナンスの情報を確認したい"),
   ("AWS Cost Explorer","AWS Cost Explorerは、費用と使用量を可視化して分析するサービスです。障害やメンテナンスの情報は表示しません。","障害や、予定されているメンテナンスの情報を確認したい"),
   ("AWS Marketplace","AWS Marketplaceは、ソフトウェアなどを探して購入するためのカタログです。障害やメンテナンスの情報を確認する場所ではありません。","障害や、予定されているメンテナンスの情報を確認したい")],
  ["障害や、予定されているメンテナンスの情報を確認したい","追加の費用はかけたくありません"],"自分のアカウントに影響する障害・メンテナンスの情報＝AWS Health Dashboard（追加料金なし）。",[HD],"clf-resources-partners",["aws-health-dashboard"]),
]
for x in clf:
    for c in x['choices']:
        if not c['correct']: assert c['eliminatedBy'] in x['stem'],x['id']
    for k in x['keywords']: assert k in x['stem'],x['id']
w('questions/clf-p9c.json',clf)
# レッスンの確認問題に追加
import json,os
def addq(les,ids):
    p=os.path.join(ROOT,'lessons',les+'.json'); d=json.load(open(p))
    for i in ids:
        if i not in d['quizQuestionIds']: d['quizQuestionIds'].append(i)
    json.dump(d,open(p,'w'),ensure_ascii=False,indent=2)
addq('saa-ha-ft',['saa-q-thr-01','saa-q-thr-02','saa-q-vpce-ha-01']); addq('saa-perf-storage',['saa-q-ebs-ev-01'])
addq('clf-billing-cost',['clf-q-org-cost-01']); addq('clf-iam',['clf-q-iam-cost-01']); addq('clf-resources-partners',['clf-q-health-cost-01'])
# 設計問題
t=json.load(open(os.path.join(ROOT,'diagrams/tpl-private-egress.json')))
nodes=[{k:v for k,v in n.items() if k!='note'} for n in t['diagram']['nodes']]
ch={"id":"ch-private-server","status":"verified","sources":t['sources'],"verifiedAt":D2,"basedOnGuide":GS,"title":"外から見えないサーバーに、外への道だけを作る","order":5,
 "scenario":"ある会社は、顧客情報を扱うアプリケーションのサーバーを、Amazon EC2で動かします。このサーバーは、インターネットから直接アクセスされてはいけません。一方で、サーバーからは、ソフトウェアの更新をインターネットから取得する必要があります。また、サーバーは大量のファイルをAmazon S3に保存します。S3への通信は、できるだけ費用を抑えたいと考えています。",
 "requirements":["サーバーは、インターネットから直接アクセスされない場所に置く","サーバーから、インターネットへ更新を取りに行ける","外からサーバーへの接続は、開始できないようにする","S3への通信は、NATの装置を通さずに行う"],
 "hints":["VPCの中に、「パブリックサブネット」と「プライベートサブネット」の2つの枠を作ります。サーバーはどちらに置きますか。","外へ出るための取り次ぎ係（NATゲートウェイ）と、S3への近道（ゲートウェイエンドポイント）は、どちらも「Amazon VPC」の箱で表します。箱の名前を書き換えて使い分けてください。"],
 "modelAnswer":{"nodes":nodes,"edges":t['diagram']['edges']},
 "modelExplanation":"サーバーは、インターネットゲートウェイへの経路を持たないプライベートサブネットに置きます。外へ出る通信は、パブリックサブネットに置いたNATゲートウェイが取り次ぎます。NATゲートウェイは、外からの接続を開始させません。S3への通信は、ゲートウェイエンドポイントを通します。ゲートウェイエンドポイントに追加の料金はかからず、NATゲートウェイを通るデータを減らせます。",
 "relatedTemplateIds":["tpl-private-egress"],
 "checklist":[
  {"id":"c1","label":"パブリックサブネットの枠がある","rule":{"type":"hasGroup","labelIncludes":["パブリック"]},"reason":"NATゲートウェイは、パブリックサブネットに置きます。"},
  {"id":"c2","label":"プライベートサブネットの枠がある","rule":{"type":"hasGroup","labelIncludes":["プライベート"]},"reason":"インターネットから直接アクセスされるべきでないサーバーは、プライベートサブネットに置きます。"},
  {"id":"c3","label":"サーバー（EC2）が、プライベートサブネットの中にある","rule":{"type":"insideGroup","serviceIds":["amazon-ec2"],"labelIncludes":["プライベート"]},"reason":"プライベートサブネットは、インターネットゲートウェイへの経路を持たないため、外から直接は届きません。"},
  {"id":"c4","label":"VPCの部品（NATゲートウェイなど）が、パブリックサブネットの中にある","rule":{"type":"insideGroup","serviceIds":["amazon-vpc"],"labelIncludes":["パブリック"]},"reason":"外へ出るための取り次ぎ係であるNATゲートウェイは、パブリックサブネットに置きます。"},
  {"id":"c5","label":"サーバーとVPCの部品が、線でつながっている","rule":{"type":"connected","from":["amazon-ec2"],"to":["amazon-vpc"]},"reason":"サーバーからの通信は、NATゲートウェイやゲートウェイエンドポイントを通って外へ出ます。"},
  {"id":"c6","label":"Amazon S3を使っている","rule":{"type":"hasService","serviceIds":["amazon-s3"]},"reason":"ファイルの保存先です。"},
  {"id":"c7","label":"VPCの部品（ゲートウェイエンドポイント）とS3が、線でつながっている","rule":{"type":"connected","from":["amazon-vpc"],"to":["amazon-s3"]},"reason":"ゲートウェイエンドポイントを通すと、インターネットゲートウェイやNATの装置を使わずにS3へ接続できます。追加の料金はかかりません。"}]}
w('challenges/ch-private-server.json',ch)
print('ok')
