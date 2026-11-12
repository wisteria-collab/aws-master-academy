import json, os, re
src=open('batch1.py').read()
exec(src[:src.index('# ---------------- 用語')])
for name in ['def svc','def q(','def lesson(']:
    i=src.index(name); m=re.search(r'\n(?=\S)', src[i:]); exec(src[i:i+m.start()+1])
L=lambda id:{"type":"lesson","id":id}; S=lambda id:{"type":"service","id":id}
GD4={"title":"CLF-C02 試験ガイド 第4分野（AWS公式）","url":"https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain4.html"}
CFN={"title":"What is CloudFormation?（AWS CloudFormation ユーザーガイド）","url":"https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html"}
CLI={"title":"What is the AWS Command Line Interface?（AWS CLI ユーザーガイド）","url":"https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html"}
CLIP={"title":"AWS Command Line Interface（AWS公式）","url":"https://aws.amazon.com/cli/"}
HEALTH={"title":"Concepts for AWS Health（AWS Health ユーザーガイド）","url":"https://docs.aws.amazon.com/health/latest/ug/aws-health-concepts-and-terms.html"}
REPOST={"title":"About AWS re:Post（AWS公式）","url":"https://repost.aws/about"}
APG={"title":"AWS Prescriptive Guidance（AWS公式）","url":"https://aws.amazon.com/prescriptive-guidance/"}
ABUSE={"title":"How do I report abuse of AWS resources?（AWS re:Post ナレッジセンター）","url":"https://repost.aws/knowledge-center/report-aws-abuse"}
TYPES={"title":"Types of cloud computing（AWSホワイトペーパー）","url":"https://docs.aws.amazon.com/whitepapers/latest/aws-overview/types-of-cloud-computing.html"}
MP={"title":"What is AWS Marketplace?（AWS Marketplace ガイド）","url":"https://docs.aws.amazon.com/marketplace/latest/buyerguide/what-is-marketplace.html"}

# ---------------- 用語 ----------------
terms=[
 ("api","API","プログラムから、サービスの機能を呼び出すための窓口です。AWSの操作は、最終的にAWSのAPIを通じて行われます。",
  "レストランの「注文票」のようなものです。決まった書き方で注文を出すと、厨房（AWS）がそのとおりに動いてくれます。",
  "AWSマネジメントコンソールでの操作も、AWS CLIのコマンドも、裏側ではAWSのAPIを呼び出している。",[CLI,GD3]),
 ("cli","CLI","コマンドラインインターフェイスの略で、文字のコマンドを入力して操作する方法です。AWS CLIは、コマンドでAWSのサービスを操作するツールです。",
  "画面のボタンを押す代わりに、「これをして」と文章で指示を出すイメージです。同じ指示を紙に書いておけば、何度でも同じように実行できます。",
  "AWS CLIのコマンドをスクリプトにまとめ、毎晩決まった操作を自動で実行する。",[CLI,CLIP,GD3]),
 ("sdk","SDK","ソフトウェア開発キットの略です。AWS SDKを使うと、アプリケーションのプログラムからAWSのサービスを利用できます。",
  "料理のレシピに「ここで宅配を頼む」と書き込んでおくイメージです。プログラム自身が、必要なときにAWSに依頼を出します。",
  "ウェブアプリケーションのプログラムから、AWS SDKを使って画像をAmazon S3に保存する。",[CLI,GD3]),
 ("iac","IaC","Infrastructure as Code（コードとしてのインフラストラクチャ）の略で、サーバーやネットワークなどの構成を、テキストファイルに書いて管理する方法です。",
  "家を建てるときの「設計図」のようなものです。設計図があれば、同じ家を何軒でも、間違いなく建てられます。",
  "AWS CloudFormationのテンプレートに構成を書いておき、検証用と本番用の環境を同じ内容で作る。",[CFN,GD3]),
 ("template","テンプレート","AWS CloudFormationで、作りたいAWSリソースとその設定を記述したテキストファイルです。",
  "料理の「レシピ」のようなものです。レシピどおりに作れば、誰が作っても同じ料理ができます。",
  "テンプレートに、ロードバランサー、Auto Scalingグループ、データベースを記述し、まとめて作成する。",[CFN]),
 ("hybrid","ハイブリッド","クラウド上のリソースと、クラウドではない既存のリソース（オンプレミスなど）を接続して使う形です。",
  "自宅の本棚（オンプレミス）と、貸倉庫（クラウド）の両方を使い分けるイメージです。",
  "社内のデータセンターにあるシステムと、AWS上のシステムを接続して、両方を使い続ける。",[TYPES,GD3]),
 ("isv","独立系ソフトウェアベンダー","自社のソフトウェア製品を開発して販売する企業です。ISVと略します。AWSパートナーの一種です。",
  "ショッピングモール（AWS Marketplace）に出店している「専門店」のようなものです。",
  "独立系ソフトウェアベンダーが、自社のセキュリティソフトウェアをAWS Marketplaceで販売する。",[MP,GD4]),
 ("system-integrator","システムインテグレーター","顧客のシステムの設計や構築、移行などを支援する企業です。SIと略します。AWSパートナーの一種です。",
  "家を建てるときの「工務店」のようなものです。材料（AWSのサービス）を組み合わせて、注文に合った家を建ててくれます。",
  "AWSへの移行の経験が少ない企業が、システムインテグレーターに移行の支援を依頼する。",[GD4]),
]
old=json.load(open(os.path.join(ROOT,'glossary/terms.json')))
new=[{**meta(i,s_),"term":t,"description":d,"plain":pl,"example":ex,"serviceIds":[]} for i,t,d,pl,ex,s_ in terms]
ids={t['id'] for t in new}
w('glossary/terms.json',[t for t in old if t['id'] not in ids]+new)

# ---------------- サービス ----------------
MG="management-governance"
D3=[{"exam":"clf","domainId":"clf-d3"}]; D4=[{"exam":"clf","domainId":"clf-d4"}]
def s6(dom,id,name,aliases,summary,analogy,bdesc,edesc,points,uses,mech,pros,cons,scenes,similar,related,imp,doc,srcs):
    return svc(id,name,aliases,MG,summary,analogy,bdesc,edesc,points,uses,mech,pros,cons,scenes,similar,related,[],imp,dom,doc,srcs)
H={"clf":"high","saa":"high"}; HM={"clf":"high","saa":"mid"}; ML={"clf":"mid","saa":"low"}
services=[
 s6(D3,"aws-cloudformation","AWS CloudFormation",["CloudFormation","クラウドフォーメーション"],
  "AWSリソースの構成をテンプレートに記述し、そのとおりにまとめて作成・管理するIaC（コードとしてのインフラストラクチャ）のサービス。",
  "家の「設計図」と、それを見て家を建ててくれる「大工さん」に似ています。設計図（テンプレート）を渡せば、何軒でも同じ家を建ててくれます。",
  "作りたいサーバーやデータベースなどを、テキストファイル（テンプレート）に書いておくと、そのとおりに自動で作ってくれるサービスです。同じ構成を、何度でも同じように作れます。",
  "AWSリソースとその設定をテンプレートに記述し、そのテンプレートからスタックを作成すると、CloudFormationがリソースをプロビジョニングします。リソースの集まりを、スタックという1つの単位として管理でき、スタックを削除すると中のリソースもまとめて削除されます。テンプレートはテキストファイルなので、差分を追うことでインフラストラクチャの変更を追跡できます。テンプレートを使い回すことで、インフラストラクチャを素早く複製できます。",
  ["IaC（コードとしてのインフラストラクチャ）＝AWS CloudFormation。",
   "テンプレートにリソースを記述し、スタックとしてまとめて作成・管理・削除する。",
   "同じ構成を、繰り返し、予測どおりに作れる。複数の環境やリージョンへの複製に向く。",
   "テンプレートはテキストファイルなので、変更の履歴を追跡できる。",
   "「繰り返し可能なプロセス」が求められたらIaC、「一度きりの操作」ならコンソールでもよい。"],
  ["検証用と本番用の環境を、同じ構成で作る","同じシステムを、別のリージョンにも複製する"],
  "利用者がテンプレートを用意し、そこからスタックを作成します。CloudFormationが、テンプレートに書かれたリソースを作成・設定します。",
  ["同じ構成を繰り返し作れる","リソースをまとめて1つの単位で管理できる","変更をテキストの差分として追跡できる"],
  ["テンプレートを書く必要がある"],
  ["手作業での設定ミスをなくすために、環境の構築をテンプレートにまとめる"],
  ["aws-elastic-beanstalk"],["aws-cli","aws-management-console"],H,"https://docs.aws.amazon.com/cloudformation/",[CFN,GD3]),
 s6(D3,"aws-cli","AWS CLI",["CLI","AWS Command Line Interface","コマンドラインインターフェイス"],
  "コマンドラインからAWSのサービスを操作し、スクリプトで自動化できる統合ツール。",
  "画面のボタンを1つずつ押す代わりに、「指示書」を書いて渡すようなものです。指示書を残しておけば、同じ作業を何度でも同じように実行できます。",
  "文字のコマンドを入力して、AWSを操作するためのツールです。コマンドをファイルにまとめておけば、作業を自動化できます。",
  "AWSのサービスを管理するための統合ツールです。1つのツールをダウンロードして設定するだけで、複数のAWSのサービスをコマンドラインから操作し、スクリプトで自動化できます。ブラウザベースのAWSマネジメントコンソールが提供する機能と同等の機能を、コマンドで実行できます。",
  ["コマンドラインからの操作と、スクリプトによる自動化＝AWS CLI。",
   "プログラムによるアクセス（API、SDK、CLI）の1つ。",
   "アプリケーションのプログラムの中からAWSを利用するのはAWS SDK。",
   "画面で操作するのはAWSマネジメントコンソール。"],
  ["決まった操作を、スクリプトで繰り返し実行する","多数のリソースを、まとめて操作する"],
  "利用者がコマンドを入力すると、AWS CLIがAWSのサービスのAPIを呼び出します。",
  ["複数のサービスを1つのツールで操作できる","スクリプトで自動化できる"],
  ["コマンドを覚える必要がある"],
  ["毎日決まった時刻に行う操作を、スクリプトにして自動化する"],
  ["aws-management-console"],["aws-cloudformation"],HM,"https://docs.aws.amazon.com/cli/",[CLI,CLIP,GD3]),
 s6(D3,"aws-management-console","AWSマネジメントコンソール",["Management Console","マネコン","コンソール"],
  "ブラウザからAWSのサービスを操作するための画面。",
  "家電の「リモコン」や、スマートフォンの「設定画面」のようなものです。ボタンやメニューを見ながら操作できます。",
  "ウェブブラウザでAWSにサインインして、画面を見ながらサービスを操作する方法です。初めての人にもわかりやすい操作方法です。",
  "ブラウザベースでAWSのサービスにアクセスし、管理するための画面です。試験ガイドでは、AWSのサービスにアクセスする方法として、プログラムによるアクセス（API、SDK、CLI）、AWSマネジメントコンソール、IaC（コードとしてのインフラストラクチャ）が挙げられています。",
  ["ブラウザの画面で操作する＝AWSマネジメントコンソール。",
   "画面を見ながらの一度きりの操作や、状況の確認に向く。",
   "同じ操作を繰り返すなら、AWS CLIのスクリプトやIaC（AWS CloudFormation）を検討する。"],
  ["設定内容を画面で確認する","初めて使うサービスを試してみる"],
  "ブラウザでサインインし、画面のメニューからサービスを選んで操作します。",
  ["画面を見ながら操作できる","ツールのインストールが不要"],
  ["手作業のため、同じ操作を何度も正確に繰り返す用途には向かない"],
  ["新しく作ったリソースの設定を、画面で確認する"],
  ["aws-cli"],["aws-cloudformation"],HM,"https://docs.aws.amazon.com/awsconsolehelpdocs/",[CLI,GD3]),
 s6(D4,"aws-health-dashboard","AWS Health Dashboard",["Health Dashboard","AWS Health","ヘルスダッシュボード"],
  "AWSのサービスの状態と、自分のアカウントに影響するイベントを確認できるダッシュボード。",
  "鉄道の「運行情報」に似ています。全路線の運行状況に加えて、自分がいつも使う路線の遅れや工事の予定を知らせてくれます。",
  "AWSのサービスで障害が起きていないか、自分のアカウントに影響する出来事や予定された変更がないかを確認できる画面です。",
  "AWS Health Dashboardでは、AWS Healthのイベントを確認できます。イベントには、特定のアカウントに限らない「パブリックイベント」と、自分のアカウントや組織内のアカウントに固有の「アカウント固有のイベント」があります。アカウントを持っていれば、両方を確認できます。アカウント固有のイベントは、AWS Health Dashboard、AWS Health API、Amazon EventBridgeなどを通じて把握できます。アカウントがなくても、サービス全体の状態（Service health）のページでパブリックイベントを確認できます。",
  ["AWSのサービスの状態と、自分のアカウントに影響するイベントの確認＝AWS Health Dashboard。",
   "パブリックイベント（アカウントに限らない）と、アカウント固有のイベントがある。",
   "サービス全体の状態のページは、サインインしなくても見られる。",
   "AWS Health APIを使うと、プログラムからイベントの情報を取得できる。",
   "環境を調べて推奨事項を示すのはAWS Trusted Advisor。役割が違う。"],
  ["AWS側の障害が、自分のリソースに影響しているかを確認する","予定されている変更を事前に把握する"],
  "サインインすると、自分のアカウントに関係するイベントと、パブリックイベントが表示されます。",
  ["自分のアカウントへの影響がわかる","サービス全体の状態も確認できる"],
  ["自分のアプリケーションの性能などを監視するサービスではない（それはAmazon CloudWatch）"],
  ["システムの調子が悪いときに、AWS側でイベントが起きていないかを確認する"],
  ["aws-trusted-advisor"],["amazon-cloudwatch","aws-support"],HM,"https://docs.aws.amazon.com/health/",[HEALTH,GD4]),
 s6(D4,"aws-marketplace","AWS Marketplace",["Marketplace","マーケットプレイス"],
  "サードパーティのソフトウェア、データ、サービスを、検索、購入、デプロイ、管理できる厳選されたデジタルカタログ。",
  "スマートフォンの「アプリストア」に似ています。いろいろな会社が作ったソフトウェアを探して入手でき、料金はいつもの請求にまとめられます。",
  "AWS以外の会社が提供するソフトウェアなどを探して購入し、AWS上で使い始められる場所です。料金はAWSの請求にまとめられます。",
  "顧客がサードパーティのソフトウェア、データ、サービスを検索、購入、デプロイ、管理できる、厳選されたデジタルカタログです。販売者には、独立系ソフトウェアベンダー（ISV）などがいます。製品の料金は購入者のAWSの請求に含まれます。試験ガイドでは、AWS Marketplaceが提供する主な内容として、コスト管理、ガバナンス、エンタイトルメント（利用権の管理）が挙げられています。",
  ["サードパーティのソフトウェアなどを探して購入・デプロイ＝AWS Marketplace。",
   "販売者は独立系ソフトウェアベンダー（ISV）など。",
   "料金はAWSの請求にまとめられる。",
   "AWSアカウントがあれば、購入者として利用できる。"],
  ["他社製のセキュリティソフトウェアを、AWS上ですぐに使い始める"],
  "購入者がカタログから製品を選んで購入（サブスクライブ）します。料金はAWSの請求に含まれます。",
  ["必要なソフトウェアを素早く見つけて導入できる","請求がAWSにまとまる"],
  ["製品の利用条件は、購入者と販売者の間の契約で決まる"],
  ["使い慣れた他社製のソフトウェアを、AWS上のシステムにも導入する"],
  [],["aws-support"],ML,"https://docs.aws.amazon.com/marketplace/",[MP,GD4]),
]
for s in services: w(f"services/{s['id']}.json",s)

# ---------------- 問題 ----------------
DP="clf-deploy-operate"; TR="clf-resources-partners"
qs=[
 q("clf-q-deploy-01","clf-d3","clf-3-1","scenario","single","basic",
  "ある企業は、同じ構成のシステムを、検証用と本番用の2つの環境に、手作業のミスなく繰り返し作りたいと考えています。構成をテンプレートに記述して作成する方法として、最も適切なサービスはどれですか。",
  [("AWS CloudFormation",True,"CloudFormationは、AWSリソースとその設定をテンプレートに記述し、そのとおりにリソースを作成するサービスです。同じテンプレートを使えば、同じ構成を繰り返し作れます。",None),
   ("AWSマネジメントコンソール",False,"コンソールは、ブラウザの画面で操作する方法です。手作業になるため、同じ構成をミスなく繰り返し作る、という要件には向きません。","手作業のミスなく繰り返し作りたい"),
   ("AWS Health Dashboard",False,"Health Dashboardは、AWSのサービスの状態や、アカウントに影響するイベントを確認するものです。リソースを作成するサービスではありません。","構成をテンプレートに記述して作成する"),
   ("Amazon Route 53",False,"Route 53はDNSのサービスです。システムの構成をテンプレートから作成するサービスではありません。","構成をテンプレートに記述して作成する")],
  ["繰り返し作りたい","テンプレートに記述"],"「テンプレート」「繰り返し」「同じ構成」はIaC、つまりCloudFormationです。",[CFN,GD3],["aws-cloudformation"],[L(DP),S("aws-cloudformation")]),
 q("clf-q-deploy-02","clf-d3","clf-3-1","scenario","single","basic",
  "ある運用担当者は、毎晩行っているAWSの操作を、コマンドをまとめたスクリプトで自動化したいと考えています。最も適切なものはどれですか。",
  [("AWS CLI",True,"AWS CLIは、コマンドラインからAWSのサービスを操作し、スクリプトで自動化できる統合ツールです。",None),
   ("AWSマネジメントコンソール",False,"コンソールはブラウザの画面で操作する方法です。コマンドをまとめたスクリプトで自動化する方法ではありません。","コマンドをまとめたスクリプトで自動化"),
   ("AWS Marketplace",False,"Marketplaceは、サードパーティのソフトウェアなどを購入するためのカタログです。AWSの操作を自動化するツールではありません。","スクリプトで自動化"),
   ("AWS Pricing Calculator",False,"Pricing Calculatorは、コストを見積もるためのツールです。AWSの操作を自動化するものではありません。","AWSの操作を")],
  ["コマンドをまとめたスクリプトで自動化"],"「コマンド」「スクリプト」＝AWS CLI。",[CLI,CLIP,GD3],["aws-cli"],[L(DP),S("aws-cli")]),
 q("clf-q-deploy-03","clf-d3","clf-3-1","scenario","single","standard",
  "ある開発者は、自分が作っているアプリケーションのプログラムの中から、Amazon S3にファイルを保存する処理を呼び出したいと考えています。最も適切なものはどれですか。",
  [("AWS SDK",True,"AWS SDKは、アプリケーションのプログラムからAWSのサービスを利用するためのものです。プログラムの中からS3の操作を呼び出せます。",None),
   ("AWSマネジメントコンソール",False,"コンソールは、人がブラウザの画面で操作する方法です。アプリケーションのプログラムの中から呼び出すものではありません。","アプリケーションのプログラムの中から"),
   ("AWS Health Dashboard",False,"Health Dashboardは、サービスの状態やイベントを確認するものです。プログラムからS3にファイルを保存するためのものではありません。","Amazon S3にファイルを保存する処理を呼び出したい"),
   ("AWS Budgets",False,"Budgetsは、予算を設定してアラートを受け取るサービスです。プログラムからAWSのサービスを利用するためのものではありません。","プログラムの中から")],
  ["アプリケーションのプログラムの中から"],"プログラムの中から使う＝SDK。コマンドで使う＝CLI。画面で使う＝コンソール。",[CLI,GD3],["amazon-s3"],[L(DP)]),
 q("clf-q-deploy-04","clf-d3","clf-3-1","scenario","single","basic",
  "ある企業は、社内のデータセンターにあるシステムを残したまま、新しいシステムをAWS上に作り、両者を接続して使うことにしました。このデプロイモデルを何と呼びますか。",
  [("ハイブリッド",True,"ハイブリッドは、クラウド上のリソースと、クラウドではない既存のリソースを接続して使う形です。データセンターのシステムとAWS上のシステムを接続する構成は、これに当たります。",None),
   ("クラウド",False,"クラウドのデプロイモデルは、アプリケーション全体をクラウド上で動かす形です。問題文では、社内のデータセンターにあるシステムも残して使い続けます。","社内のデータセンターにあるシステムを残したまま"),
   ("オンプレミス",False,"オンプレミスのデプロイモデルは、リソースを自社の施設の中に配置する形です。問題文では、新しいシステムをAWS上に作っています。","新しいシステムをAWS上に作り"),
   ("エッジロケーション",False,"エッジロケーションは、Amazon CloudFrontがコンテンツを配信するための拠点です。デプロイモデルの名前ではありません。","このデプロイモデルを何と呼びますか")],
  ["データセンターにあるシステムを残したまま","AWS上に作り","両者を接続"],"「オンプレミスとクラウドを接続して両方使う」＝ハイブリッド。",[TYPES,GD3],[],[L(DP)]),
 q("clf-q-deploy-05","clf-d3","clf-3-1","scenario","single","standard",
  "ある担当者は、作成済みのAmazon EC2インスタンスの設定を、一度だけ画面で確認したいと考えています。ツールのインストールやテンプレートの作成はしたくありません。最も適切な方法はどれですか。",
  [("AWSマネジメントコンソールを使う",True,"コンソールは、ブラウザからAWSのサービスを操作・確認する画面です。一度きりの確認であれば、画面で見るのが手軽です。",None),
   ("AWS CloudFormationのテンプレートを作成する",False,"CloudFormationは、構成をテンプレートに記述して繰り返し作成するためのサービスです。一度だけ設定を確認するという目的には合わず、テンプレートの作成も必要になります。","テンプレートの作成はしたくありません"),
   ("AWS CLIをインストールしてスクリプトを作成する",False,"AWS CLIでも設定は確認できますが、ツールのインストールが必要です。一度だけ画面で確認したい、という要件には合いません。","ツールのインストール"),
   ("AWS SDKを使ってプログラムを作成する",False,"AWS SDKは、アプリケーションのプログラムからAWSを利用するためのものです。一度だけの確認のためにプログラムを作る必要はありません。","一度だけ画面で確認したい")],
  ["一度だけ画面で確認したい","ツールのインストールやテンプレートの作成はしたくありません"],"一度きりの操作や確認はコンソール、繰り返す操作はCLIやIaC、と使い分けます。",[CLI,CFN,GD3],["aws-management-console"],[L(DP),S("aws-management-console")]),
 q("clf-q-res-01","clf-d4","clf-4-3","scenario","single","basic",
  "ある企業は、AWSのサービスで起きているイベントのうち、自社のアカウントのリソースに影響するものや、予定されている変更を確認したいと考えています。最も適切なものはどれですか。",
  [("AWS Health Dashboard",True,"Health Dashboardでは、アカウントに限らないパブリックイベントに加えて、自分のアカウントに固有のイベントを確認できます。",None),
   ("AWS Trusted Advisor",False,"Trusted Advisorは、環境を調べて、コスト最適化やセキュリティなどの推奨事項を示すサービスです。AWSのサービスで起きているイベントを知らせるものではありません。","AWSのサービスで起きているイベント"),
   ("AWS Cost Explorer",False,"Cost Explorerは、コストと使用量を分析するツールです。サービスのイベントを確認するものではありません。","イベントのうち、自社のアカウントのリソースに影響するもの"),
   ("AWS Marketplace",False,"Marketplaceは、サードパーティのソフトウェアなどを購入するためのカタログです。サービスのイベントとは関係がありません。","AWSのサービスで起きているイベント")],
  ["AWSのサービスで起きているイベント","自社のアカウントのリソースに影響するもの"],"「AWS側のイベントが自分に影響するか」＝Health Dashboard。",[HEALTH,GD4],["aws-health-dashboard"],[L(TR),S("aws-health-dashboard")]),
 q("clf-q-res-02","clf-d4","clf-4-3","scenario","single","standard",
  "ある人が、AWSのリソースから送信されたと思われる迷惑メールを大量に受け取りました。AWSのリソースが不正に使われている疑いを報告したい場合、報告先として最も適切なものはどれですか。",
  [("AWS Trust & Safetyチーム",True,"AWSのリソースが不正な目的で使われている疑いがある場合は、AWS Trust & Safetyチームに報告します。AWSの利用者でなくても報告できます。",None),
   ("AWS Supportに技術的なサポートケースを起票する",False,"AWS Supportは、不正利用の報告には対応できないと案内されています。不正利用の報告は、Trust & Safetyチームが扱います。","不正に使われている疑いを報告したい"),
   ("AWS Health Dashboard",False,"Health Dashboardは、AWSのサービスの状態やイベントを確認するものです。不正利用を報告する窓口ではありません。","報告先として"),
   ("AWS Marketplace",False,"Marketplaceは、サードパーティのソフトウェアなどを購入するためのカタログです。不正利用の報告先ではありません。","報告先として")],
  ["不正に使われている疑いを報告したい"],"AWSリソースの不正利用の報告＝Trust & Safetyチーム。AWS Supportではありません。",[ABUSE,GD4],[],[L(TR)]),
 q("clf-q-res-03","clf-d4","clf-4-3","scenario","single","basic",
  "ある企業は、他社が提供するセキュリティソフトウェアを探して購入し、AWS上にデプロイしたいと考えています。料金はAWSの請求にまとめたいと考えています。最も適切なものはどれですか。",
  [("AWS Marketplace",True,"Marketplaceは、サードパーティのソフトウェア、データ、サービスを検索、購入、デプロイ、管理できる、厳選されたデジタルカタログです。料金はAWSの請求に含まれます。",None),
   ("AWS Artifact",False,"Artifactは、AWSのセキュリティとコンプライアンスに関するレポートを入手するためのサービスです。他社のソフトウェアを購入する場所ではありません。","他社が提供するセキュリティソフトウェアを探して購入"),
   ("AWS Trusted Advisor",False,"Trusted Advisorは、環境を調べて推奨事項を示すサービスです。ソフトウェアを購入する場所ではありません。","探して購入"),
   ("AWS Organizations",False,"Organizationsは、複数のアカウントをまとめ、請求を一括にできるサービスです。他社のソフトウェアを探して購入するカタログではありません。","他社が提供するセキュリティソフトウェアを探して購入")],
  ["他社が提供する","探して購入","AWSの請求にまとめたい"],"「サードパーティのソフトウェアを探して購入」＝Marketplace。",[MP,GD4],["aws-marketplace"],[L(TR),S("aws-marketplace")]),
 q("clf-q-res-04","clf-d4","clf-4-3","scenario","single","basic",
  "ある開発者は、AWSの使い方について技術的な疑問があります。AWSが管理するナレッジの場で、よくある質問をまとめた公式の記事を読んだり、コミュニティに質問したりしたいと考えています。最も適切なものはどれですか。",
  [("AWS re:Post",True,"re:Postは、AWSが管理するナレッジハブです。よくある技術的な質問やアカウントの質問を扱うAWS公式のナレッジセンターの記事があり、コミュニティに質問することもできます。",None),
   ("AWS Artifact",False,"Artifactは、AWSのセキュリティとコンプライアンスに関するレポートを入手するためのサービスです。技術的な疑問を質問する場ではありません。","コミュニティに質問したり"),
   ("AWS Budgets",False,"Budgetsは、予算を設定してアラートを受け取るサービスです。技術的な疑問を解決する場ではありません。","技術的な疑問"),
   ("AWS Health Dashboard",False,"Health Dashboardは、AWSのサービスの状態やイベントを確認するものです。記事を読んだり質問したりする場ではありません。","コミュニティに質問したり")],
  ["よくある質問をまとめた公式の記事","コミュニティに質問"],"コミュニティへの質問と、ナレッジセンターの記事＝re:Post。",[REPOST,GD4],[],[L(TR)]),
 q("clf-q-res-05","clf-d4","clf-4-3","scenario","single","standard",
  "ある企業は、クラウドへの移行とモダナイゼーションを進めるにあたり、AWSの専門家がまとめた、実績のある戦略、ガイド、パターンを参考にしたいと考えています。最も適切なものはどれですか。",
  [("AWS Prescriptive Guidance",True,"Prescriptive Guidanceは、クラウドへの移行、モダナイゼーション、最適化のプロジェクトを加速するための、実績のある戦略、ガイド、パターンを提供します。",None),
   ("AWS Health Dashboard",False,"Health Dashboardは、AWSのサービスの状態やイベントを確認するものです。移行の戦略やパターンをまとめた資料ではありません。","戦略、ガイド、パターンを参考にしたい"),
   ("AWS Pricing Calculator",False,"Pricing Calculatorは、コストを見積もるためのツールです。移行の戦略やパターンを提供するものではありません。","戦略、ガイド、パターン"),
   ("AWS Trust & Safetyチーム",False,"Trust & Safetyチームは、AWSリソースの不正利用の報告を扱うチームです。移行の進め方の資料を提供するものではありません。","移行とモダナイゼーションを進めるにあたり")],
  ["移行とモダナイゼーション","戦略、ガイド、パターン"],"「戦略、ガイド、パターン」＝Prescriptive Guidance。",[APG,GD4],[],[L(TR),L("clf-migration-caf")]),
]
for x in qs:
    for c in x['choices']:
        if not c['correct']: assert c['eliminatedBy'] in x['stem'], (x['id'], c['eliminatedBy'])
    for k in x['keywords']: assert k in x['stem'], (x['id'], k)
    assert sum(c['correct'] for c in x['choices'])==1
w('questions/clf-batch6.json',qs)

# ---------------- レッスン ----------------
lessons=[
 lesson(DP,9,"AWSへのアクセス方法とデプロイモデル","clf-d3",["clf-3-1"],
  "AWSのサービスを操作する方法は1つではありません。画面で操作する方法、コマンドやプログラムから操作する方法、構成をファイルに書いて作る方法があります。\nCLFの試験ガイドでは、プログラムによるアクセス（API、SDK、CLI）、AWSマネジメントコンソール、IaC（コードとしてのインフラストラクチャ）の中から、場面に合った方法を選べることが求められます。また、一度きりの操作か、繰り返し可能なプロセスかを見きわめること、デプロイモデル（クラウド、ハイブリッド、オンプレミス）を見分けることも挙げられています。",
  "料理にたとえます。AWSマネジメントコンソールは、「自分でキッチンに立って作る」方法です。AWS CLIは、「手順をメモに書いて、そのとおりに作ってもらう」方法です。AWS SDKは、「別の料理のレシピの途中に、この料理の手順を組み込む」方法です。IaCは、「完成形を書いたレシピを渡して、まるごと作ってもらう」方法です。",
  "1回だけの作業なら、画面で操作するのが手軽です。でも、同じ作業を何度も繰り返すなら、手順をファイルに書いておいたほうが、速くて間違いがありません。「何回やるか」が、方法を選ぶ大きな手がかりです。",
  ["初めてのサービスを、画面で試してみる","毎晩の決まった操作を、スクリプトで自動化する","検証用と本番用の環境を、同じ構成で作る","オンプレミスのシステムとAWS上のシステムを接続して使う"],
  "【AWSにアクセスする方法】\n・AWSマネジメントコンソール：ブラウザの画面で操作します。\n・AWS CLI：コマンドラインからAWSのサービスを操作する統合ツールです。スクリプトで自動化できます。\n・AWS SDK：アプリケーションのプログラムからAWSのサービスを利用します。\n・IaC（AWS CloudFormationなど）：リソースの構成をテンプレートに記述し、そのとおりに作成します。\nどの方法でも、最終的にはAWSのAPIが呼び出されます。\n【一度きりの操作と、繰り返し可能なプロセス】\n一度きりの操作や確認には、コンソールが手軽です。同じ操作を繰り返す場合や、複数の環境に同じ構成を作る場合は、スクリプトやテンプレートを使うと、予測どおりに繰り返せます。\nAWS CloudFormationでは、テンプレートからスタックを作成すると、記述されたリソースがまとめて作成されます。テンプレートはテキストファイルなので、変更を追跡でき、同じ構成を素早く複製できます。\n【デプロイモデル】\n・クラウド：アプリケーション全体をクラウド上で動かします。\n・ハイブリッド：クラウド上のリソースと、クラウドではない既存のリソースを接続して使います。\n・オンプレミス：リソースを自社の施設の中に配置します。",
  "access-methods",["aws-management-console","aws-cli","aws-cloudformation","aws-direct-connect","aws-vpn"],
  ["画面で操作＝AWSマネジメントコンソール。コマンドで操作＝AWS CLI。プログラムから利用＝AWS SDK。",
   "構成をテンプレートに書いて作る＝IaC（AWS CloudFormation）。",
   "一度きりの操作はコンソール、繰り返す操作はスクリプトやIaC。",
   "CloudFormationは、テンプレートからスタックを作成し、リソースをまとめて管理する。",
   "デプロイモデル：クラウド（すべてクラウド）、ハイブリッド（クラウドと既存の環境を接続）、オンプレミス（自社の施設内）。",
   "ハイブリッドの接続には、AWS VPNやAWS Direct Connectを使う。"],
  ["clf-q-deploy-01","clf-q-deploy-02","clf-q-deploy-03","clf-q-deploy-04","clf-q-deploy-05"],
  ["api","cli","sdk","iac","template","hybrid","on-premises"],[CLI,CLIP,CFN,TYPES,GD3]),
 lesson(TR,17,"技術リソースとAWSパートナー","clf-d4",["clf-4-3"],
  "AWSには、サポートプランのほかにも、困ったときに頼れる情報源や窓口、そして支援してくれるパートナー企業があります。\nCLFの試験ガイドでは、技術リソース（AWS Prescriptive Guidance、AWSナレッジセンター、AWS re:Post）、AWS Health DashboardとAWS Health API、不正利用を報告するAWS Trust & Safetyチーム、AWSパートナーとAWS Marketplace、技術支援の選択肢（AWSプロフェッショナルサービス、AWSソリューションアーキテクト）が挙げられています。\n「何をしたいときに、どこを見るか」で整理します。",
  "街の施設にたとえます。AWS re:Postは、質問できる「掲示板と図書館」です。AWS Prescriptive Guidanceは、専門家が書いた「手引き書」です。AWS Health Dashboardは、交通機関の「運行情報」です。AWS Trust & Safetyチームは、迷惑行為を届け出る「通報窓口」です。AWS Marketplaceは、他社の製品が並ぶ「ショッピングモール」です。AWSパートナーは、頼れる「専門業者」です。",
  "困りごとの種類によって、頼る先が変わります。「調べたい」「AWS側の状況を知りたい」「不正を報告したい」「他社の製品を買いたい」「誰かに手伝ってほしい」の5つに分けて覚えると、迷いません。",
  ["技術的な疑問を、公式の記事やコミュニティで解決する","AWS側のイベントが、自社に影響しているかを確認する","AWSのリソースの不正利用を報告する","他社製のソフトウェアを購入して、AWS上で使う","移行の進め方について、専門の企業に支援を依頼する"],
  "【調べたい：技術リソース】\n・AWS re:Post：AWSが管理するナレッジハブです。コミュニティに質問できます。\n・AWSナレッジセンター：よくある技術的な質問やアカウントの質問を扱う、AWS公式の記事や動画です。re:Postの中にあります。\n・AWS Prescriptive Guidance：クラウドへの移行、モダナイゼーション、最適化を進めるための、実績のある戦略、ガイド、パターンです。\nこのほか、AWSのドキュメント、ホワイトペーパー、ブログも、公式のウェブサイトで公開されています。\n【AWS側の状況を知りたい：AWS Health Dashboard】\nAWS Healthのイベントを確認できます。アカウントに限らない「パブリックイベント」と、自分のアカウントに固有の「アカウント固有のイベント」があります。AWS Health APIを使うと、プログラムからイベントの情報を取得できます。\n環境を調べて推奨事項を示すAWS Trusted Advisorとあわせて、環境の管理と監視に役立ちます。\n【不正を報告したい：AWS Trust & Safetyチーム】\nAWSのリソースが不正な目的で使われている疑いがあるときは、AWS Trust & Safetyチームに報告します。AWS Supportは、不正利用の報告には対応できないと案内されています。\n【他社の製品を買いたい：AWS Marketplace】\nサードパーティのソフトウェア、データ、サービスを、検索、購入、デプロイ、管理できる、厳選されたデジタルカタログです。料金はAWSの請求に含まれます。\n【誰かに手伝ってほしい：AWSパートナーと技術支援】\nAWSパートナーには、独立系ソフトウェアベンダー（ISV）やシステムインテグレーター（SI）が含まれます。試験ガイドでは、パートナーになる利点として、パートナー向けのトレーニングと認定、パートナー向けのイベント、パートナー向けのボリューム割引が挙げられています。\nAWS自身が提供する技術支援の選択肢として、AWSプロフェッショナルサービスと、AWSソリューションアーキテクトが挙げられています。",
  None,["aws-health-dashboard","aws-marketplace","aws-trusted-advisor","aws-support"],
  ["コミュニティへの質問と、公式のナレッジセンターの記事＝AWS re:Post。",
   "移行やモダナイゼーションの戦略、ガイド、パターン＝AWS Prescriptive Guidance。",
   "AWSのサービスの状態と、自分のアカウントに影響するイベント＝AWS Health Dashboard（プログラムからはAWS Health API）。",
   "AWSリソースの不正利用の報告＝AWS Trust & Safetyチーム。AWS Supportではない。",
   "サードパーティのソフトウェアなどの購入＝AWS Marketplace。料金はAWSの請求に含まれる。",
   "AWSパートナー＝独立系ソフトウェアベンダー（ISV）、システムインテグレーター（SI）など。",
   "パートナーになる利点：トレーニングと認定、イベント、ボリューム割引。",
   "AWSによる技術支援：AWSプロフェッショナルサービス、AWSソリューションアーキテクト。"],
  ["clf-q-res-01","clf-q-res-02","clf-q-res-03","clf-q-res-04","clf-q-res-05"],
  ["isv","system-integrator","api"],[REPOST,APG,HEALTH,ABUSE,MP,GD4]),
]
for l in lessons: w(f"lessons/{l['id']}.json",l)

ORDER=["clf-cloud-basics","clf-cloud-economics","clf-global-edge","clf-regions-azs","clf-compute","clf-storage","clf-database","clf-network",DP,
       "clf-shared-responsibility","clf-iam","clf-security-governance","clf-security-services","clf-pricing-models","clf-billing-cost","clf-support-plans",TR,
       "clf-well-architected","clf-migration-caf"]
ld=os.path.join(ROOT,'lessons')
files={f[:-5] for f in os.listdir(ld) if f.startswith('clf-')}
assert files==set(ORDER),(files^set(ORDER))
for n,lid in enumerate(ORDER,1):
    p=os.path.join(ld,lid+'.json'); d=json.load(open(p)); d['order']=n
    json.dump(d,open(p,'w'),ensure_ascii=False,indent=2)
print('orders',len(ORDER))
