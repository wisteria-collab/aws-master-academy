from p4common import *
D2='2026-11-12'
IAME={"title":"Policy evaluation logic（IAM ユーザーガイド）","url":"https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html"}
IAMH={"title":"How IAM works（IAM ユーザーガイド）","url":"https://docs.aws.amazon.com/IAM/latest/UserGuide/intro-structure.html"}
LMEM={"title":"Configure Lambda function memory（AWS Lambda デベロッパーガイド）","url":"https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html"}
CO={"title":"What is AWS Compute Optimizer?（AWS Compute Optimizer ユーザーガイド）","url":"https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html"}
SQ_={"title":"What is Service Quotas?（Service Quotas ユーザーガイド）","url":"https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html"}
EC2Q={"title":"Amazon EC2 service quotas（Amazon EC2 ユーザーガイド）","url":"https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-resource-limits.html"}
IMM={"title":"REL08-BP04 Deploy using immutable infrastructure（AWS Well-Architected Framework）","url":"https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_tracking_change_management_immutable_infrastructure.html"}
S3C={"title":"Understanding and managing Amazon S3 storage classes（Amazon S3 ユーザーガイド）","url":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html"}
S3G={"title":"Understanding S3 Glacier storage classes（Amazon S3 ユーザーガイド）","url":"https://docs.aws.amazon.com/AmazonS3/latest/userguide/glacier-storage-classes.html"}
NATC={"title":"Compare NAT gateways and NAT instances（Amazon VPC ユーザーガイド）","url":"https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-comparison.html"}
NATB={"title":"NAT gateway basics（Amazon VPC ユーザーガイド）","url":"https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html"}
C8={"title":"COST08-BP03 Implement services to reduce data transfer costs（AWS Well-Architected コスト最適化の柱）","url":"https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/cost_data_transfer_implement_services.html"}
EGR={"title":"Using the NAT gateway for centralized IPv4 egress（AWSホワイトペーパー）","url":"https://docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/using-nat-gateway-for-centralized-egress.html"}

def load(p): return json.load(open(os.path.join(ROOT,p)))
def save(p,d): json.dump(d,open(os.path.join(ROOT,p),'w'),ensure_ascii=False,indent=2)
def addsrc(d,srcs):
    urls={s['url'] for s in d['sources']}
    d['sources']+= [s for s in srcs if s['url'] not in urls]; d['verifiedAt']=D2
def patch_lesson(id,srcs,remove=None,add_text=None,points=[],quiz=[],terms=[]):
    d=load(f'lessons/{id}.json'); t=d['mechanism']['text']
    if remove:
        i=t.find(remove[0])
        if i>=0: t=t[:i].rstrip('\n')+(("\n"+remove[1]) if remove[1] else "")
    if add_text and add_text.split('\n')[0] not in t: t=t.rstrip('\n')+"\n"+add_text
    d['mechanism']['text']=t
    d['examPoints']+=[p for p in points if p not in d['examPoints']]
    d['quizQuestionIds']+=[q_ for q_ in quiz if q_ not in d['quizQuestionIds']]
    d['glossaryTermIds']+=[x for x in terms if x not in d['glossaryTermIds']]
    addsrc(d,srcs); save(f'lessons/{id}.json',d)

add_terms([
 ("explicit-deny","明示的な拒否","ポリシーの中で、はっきり「拒否する」（Deny）と書かれていることです。どれか1つのポリシーに明示的な拒否があれば、ほかのポリシーで許可されていても、リクエストは拒否されます。何も書かれていないために拒否されることは、「暗黙の拒否」といいます。",
  "「立入禁止」の貼り紙です。別の人が「入ってよい」と言っていても、貼り紙があれば入れません。貼り紙も許可もない部屋は、最初から入れません（暗黙の拒否）。",
  "ログ用のバケットへの操作を、明示的な拒否で禁止する。",[IAME,IAMH]),
 ("service-quota","サービスクォータ","AWSアカウントの中で使えるリソースや操作の、最大値です（上限とも呼びます）。サービスごとに既定値が決まっていて、多くはリージョンごとに適用されます。調整できるクォータは、Service Quotasで引き上げを申請できます。",
  "食べ放題の店の「1回に取れる皿の数」のような決まりです。足りなければ、店にお願いして増やしてもらいます。ただし、お願いしてから認められるまでに、時間がかかります。",
  "大きなイベントの前に、EC2のvCPU数のクォータの引き上げを、前もって申請しておく。",[SQ_,EC2Q]),
 ("immutable-infrastructure","イミュータブルインフラストラクチャ","動いている本番のサーバーなどに、更新・パッチ・設定の変更を「その場で」加えない、という考え方です。変更が必要なときは、変更を含んだ新しいインフラストラクチャを作って、そちらに切り替えます。",
  "使っている家を少しずつ直すのではなく、新しい家を建てて引っ越す方法です。新しい家に問題があれば、元の家にすぐ戻れます。",
  "新しい版のサーバー群を並行して用意し、問題がなければ通信を新しい側へ移す。",[IMM]),
])

# ---- 図鑑：AWS Compute Optimizer
w('services/aws-compute-optimizer.json',{**ssvc("saa-d4","aws-compute-optimizer","AWS Compute Optimizer",["Compute Optimizer","コンピュートオプティマイザー"],"cost-management",
 "リソースの設定と使われ方を分析して、ちょうどよい大きさ（ライトサイジング）を提案するサービス。",
 "服のサイズを見てくれる「仕立て屋」です。ふだんの着方を見て、「この服は大きすぎます」「このサイズが合います」と教えてくれます。",
 "いま使っているサーバーなどが、大きすぎないか、小さすぎないかを、実際の使われ方から調べて、合う大きさを提案してくれるサービスです。",
 "AWSのリソースの設定と使用率のメトリクスを分析して、ライトサイジングの推奨を提供し、使われていない（アイドルな）リソースを見つけるサービスです。利用するには、オプトイン（利用の申し込み）が必要です。オプトインすると、Amazon CloudWatchの直近14日間のメトリクスなどを分析します。対象には、Amazon EC2インスタンス、EC2 Auto Scalingグループ、Amazon EBSボリューム、AWS Lambda関数、AWS Fargate上のAmazon ECSサービス、Amazon AuroraとAmazon RDSのデータベースなどがあります。",
 ["使用率のメトリクスを分析して、ライトサイジングの推奨を出す＝Compute Optimizer。","使われていない（アイドルな）リソースも見つける。","利用にはオプトインが必要。CloudWatchのメトリクスを分析する。"],
 ["大きすぎるEC2インスタンスを見つけて、合うサイズに変える","Lambda関数のメモリの設定を見直す","使われていないリソースを見つける"],
 "CloudWatchに集まっている使用率のメトリクス（CPU、メモリ、ネットワーク、ディスクなど）と、リソースの設定を分析して、推奨を出します。",
 ["実際の使われ方に基づいて提案される","複数のリージョンやアカウントの結果をまとめて見られる"],["オプトインが必要","推奨を採用するかどうかは、利用者が判断する"],
 "余裕を見て大きめに作ったインスタンスが、実際にはほとんど使われていないことを見つけて、サイズを下げる。",
 ["aws-trusted-advisor","aws-cost-explorer"],["amazon-ec2","aws-lambda","amazon-ebs","amazon-cloudwatch"],{"clf":"low","saa":"mid"},"https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html",[CO,SG]),"verifiedAt":D2})

A1="saa-secure-access"; PC="saa-perf-compute"; CC="saa-cost-compute"; B2="saa-ha-ft"
def Q(id,task,stem,right,rexp,wrongs,kw,point,srcs,les,svs=[],fmt="scenario"):
    d=SQ(id,task,"standard",stem,right,rexp,wrongs,kw,point,srcs,[L(les)],svs,fmt); d['verifiedAt']=D2; return d
qs=[
 Q("saa-q-acc-14","saa-1-1","あるIAMユーザーには、Amazon S3のすべての操作を許可するポリシーが付いています。一方、ログ用のバケットに付けたバケットポリシーには、このユーザーによる操作を明示的に拒否（Deny）する記述があります。このユーザーがログ用のバケットを操作しようとすると、どうなりますか。",
  "拒否される。どのポリシーでも、明示的な拒否は、すべての許可に優先する","どれか1つのポリシーに明示的な拒否があれば、ほかのポリシーで許可されていても、リクエストは拒否されます。",
  [("許可される。アイデンティティベースのポリシーは、リソースベースのポリシーより優先される","ポリシーの種類による優先順位で決まるのではありません。明示的な拒否が、すべての許可に優先します。","明示的に拒否（Deny）する記述"),
   ("許可される。許可と拒否の両方があるときは、許可が優先される","優先されるのは、明示的な拒否です。許可があっても、明示的な拒否があれば拒否されます。","明示的に拒否（Deny）する記述"),
   ("あとから作成されたポリシーの内容に従う","ポリシーを作成した順序は、評価の結果に関係しません。明示的な拒否が、すべての許可に優先します。","明示的に拒否（Deny）する記述")],
  ["すべての操作を許可するポリシー","明示的に拒否（Deny）"],"明示的な拒否は、すべての許可に優先する。",[IAME,IAMH,SG],A1,["aws-iam"],"basic"),
 Q("saa-q-acc-15","saa-1-1","新しく作成したIAMユーザーに、ポリシーを1つも付けていません。SCPなどのほかのポリシーも設定していません。このユーザーがAmazon EC2インスタンスを起動しようとすると、どうなりますか。",
  "拒否される。既定では、すべてのリクエストは拒否される（暗黙の拒否）","既定では、すべてのリクエストは拒否されます。アイデンティティベースまたはリソースベースのポリシーに明示的な許可があって、はじめて許可されます。",
  [("許可される。拒否するポリシーがなければ、すべての操作ができる","既定は「許可」ではなく「拒否」です。許可するポリシーがなければ、操作はできません。","ポリシーを1つも付けていません"),
   ("許可される。IAMユーザーは、作成された時点で、ルートユーザーと同じ権限を持つ","IAMユーザーは、作成された時点では権限を持ちません。必要な権限を、ポリシーで与えます。","新しく作成したIAMユーザー"),
   ("EC2インスタンスの起動だけは、ポリシーがなくても許可される","特定の操作だけが、ポリシーなしで許可されることはありません。既定では、すべてのリクエストが拒否されます。","ポリシーを1つも付けていません")],
  ["ポリシーを1つも付けていません"],"既定はすべて拒否（暗黙の拒否）。明示的な許可で、はじめて許可される。",[IAMH,IAME,SG],A1,["aws-iam"],"basic"),
 Q("saa-q-pc-05","saa-3-2","ある企業のAWS Lambda関数は、画像の変換のような、CPUを多く使う処理を行っています。現在のメモリの設定は128 MBで、処理に時間がかかっています。関数のコードを変えずに、処理を速くする方法として、最も適切なものはどれですか。",
  "関数のメモリの設定を増やす","Lambdaは、設定したメモリの量に比例して、CPUの能力を割り当てます。メモリを増やすとCPUも増えるため、CPUが足かせになっている関数は、性能が大きく上がることがあります。",
  [("関数のタイムアウトの設定を延ばす","タイムアウトを延ばすと、時間切れにはなりにくくなりますが、処理そのものは速くなりません。","処理を速くする方法"),
   ("関数のメモリの設定を、さらに小さくする","メモリを小さくすると、割り当てられるCPUの能力も小さくなります。128 MBは、設定できる最小の値です。","処理を速くする方法"),
   ("CPUの設定だけを、メモリとは別に増やす","Lambdaでは、CPUは、設定したメモリの量に比例して割り当てられます。CPUだけを別に設定することはできません。","現在のメモリの設定は128 MB")],
  ["AWS Lambda関数","CPUを多く使う処理","128 MB"],"LambdaのCPUは、メモリの設定に比例する。CPUが足りないときは、メモリを増やす。",[LMEM,SG],PC,["aws-lambda"]),
 Q("saa-q-cc-07","saa-4-2","ある企業は、多数のEC2インスタンスを、余裕を見て大きめのサイズで作成しました。実際の使用率のメトリクスを分析して、大きすぎるインスタンスを見つけ、合うサイズの推奨を受け取りたいと考えています。最も適切なサービスはどれですか。",
  "AWS Compute Optimizer","Compute Optimizerは、リソースの設定と使用率のメトリクスを分析して、ライトサイジングの推奨を提供し、使われていないリソースを見つけます。",
  [("AWS Budgets","Budgetsは、予算を決めて、超えそうなときに通知を受け取るサービスです。インスタンスのサイズの推奨を出すものではありません。","合うサイズの推奨を受け取りたい"),
   ("AWS Artifact","Artifactは、AWSのコンプライアンスのレポートを入手するサービスです。使用率を分析するものではありません。","使用率のメトリクスを分析"),
   ("AWS Backup","AWS Backupは、バックアップを一元化・自動化するサービスです。インスタンスのサイズとは関係がありません。","大きすぎるインスタンスを見つけ")],
  ["使用率のメトリクスを分析","合うサイズの推奨"],"使用率を分析してライトサイジングを推奨＝Compute Optimizer。",[CO,SG],CC,["aws-compute-optimizer"]),
 Q("saa-q-ha-16","saa-2-2","ある企業は、大きな販売イベントに備えて、ふだんの数倍のEC2インスタンスを起動する計画です。ところが、テストで多数のインスタンスを起動しようとしたところ、オンデマンドインスタンスのvCPU数の上限に達して、リクエストが失敗しました。イベントの当日に同じことが起きないようにする方法として、最も適切なものはどれですか。",
  "Service Quotasで、必要なクォータの引き上げを、前もって申請しておく","クォータは、アカウントの中で使えるリソースなどの最大値で、超えようとするとリクエストは失敗します。調整できるクォータは、Service Quotasで引き上げを申請できます。審査と承認には時間がかかるため、必要になる前に申請します。",
  [("イベントの当日に、リクエストが失敗してから、引き上げを申請する","引き上げの申請は、審査と承認に時間がかかります。当日に申請したのでは、間に合わないおそれがあります。","イベントの当日に同じことが起きないようにする"),
   ("より大きなインスタンスタイプに変更して、台数を減らす","この上限は、インスタンスの台数ではなく、vCPUの数で決まっています。大きなインスタンスはvCPUも多いため、上限の問題は解決しません。","vCPU数の上限に達して"),
   ("インスタンスに付けるIAMロールの権限を増やす","失敗の原因は、権限ではなく、クォータ（上限）です。権限を増やしても、上限は変わりません。","上限に達して、リクエストが失敗しました")],
  ["vCPU数の上限に達して","リクエストが失敗","イベントの当日"],"クォータを超えるとリクエストは失敗する。Service Quotasで、前もって引き上げを申請する。",[SQ_,EC2Q,SG],B2,["amazon-ec2"]),
 Q("saa-q-ha-17","saa-2-2","ある企業は、本番のサーバーに担当者がログインして、パッチの適用や設定の変更を直接行ってきました。その結果、サーバーごとに設定が少しずつ違ってしまい、障害の原因になっています。変更を加えるときは、変更を含んだ新しいサーバー群を並行して用意し、検証してから通信を切り替え、問題があれば元に戻せるようにしたいと考えています。この考え方を何と呼びますか。",
  "イミュータブルインフラストラクチャ","イミュータブルインフラストラクチャは、本番のワークロードに、更新・パッチ・設定の変更を「その場で」行わない考え方です。変更が必要なときは、新しいインフラストラクチャに構築してデプロイします。前の版は変更されないため、問題があればすぐに戻せます。",
  [("垂直スケーリング","垂直スケーリングは、1台の大きさ（インスタンスタイプ）を変えることです。変更の加え方についての考え方ではありません。","新しいサーバー群を並行して用意し"),
   ("バックアップ＆リストア","バックアップ＆リストアは、災害対策の戦略の1つです。本番への変更の加え方についての考え方ではありません。","変更を加えるときは"),
   ("パイロットライト","パイロットライトは、災害対策の戦略の1つです。パッチや設定の変更の加え方とは関係がありません。","変更を加えるときは")],
  ["サーバーごとに設定が少しずつ違って","新しいサーバー群を並行して用意","問題があれば元に戻せる"],"その場で変更しない。新しいものを作って切り替える＝イミュータブルインフラストラクチャ。",[IMM,SG],B2,[]),
]
check_qs(qs); w('questions/saa-p7a.json',qs)

patch_lesson(A1,[IAME,IAMH],None,
 "【ポリシーの評価の基本】\n・既定では、すべてのリクエストは拒否されます（暗黙の拒否）。\n・アイデンティティベースまたはリソースベースのポリシーに明示的な許可があると、この既定が上書きされます。\n・SCP、アクセス許可の境界などがある場合は、それらもすべて、そのリクエストを許可している必要があります。\n・どのポリシーでも、明示的な拒否は、すべての許可に優先します。\n同じアカウントの中では、アイデンティティベースのポリシーとリソースベースのポリシーのどちらかが許可していれば、リクエストは許可されます（どちらにも明示的な拒否がない場合）。",
 ["ポリシーの評価：既定はすべて拒否 → 明示的な許可で許可 → 明示的な拒否は、すべての許可に優先する。"],["saa-q-acc-14","saa-q-acc-15"],["explicit-deny"])
patch_lesson(PC,[LMEM],("【この教材でまだ扱っていない項目】",""),
 "【Lambdaのメモリの選択】\nLambda関数のメモリは、128 MBから10,240 MBまで、1 MB単位で設定できます。Lambdaは、設定したメモリの量に比例して、CPUの能力を割り当てます。メモリは、関数の性能を調整する主な手段です。CPU、ネットワーク、メモリが足かせになっている関数は、メモリの設定を増やすと、性能が大きく上がることがあります。適切な設定は、Amazon CloudWatchで関数を監視して決めます。",
 ["LambdaのCPUは、メモリの設定に比例して割り当てられる。処理が遅いときは、メモリを増やすことを検討する。"],["saa-q-pc-05"])
patch_lesson(CC,[CO],None,
 "【大きさの見直しを助けるサービス】\nAWS Compute Optimizerは、リソースの設定と使用率のメトリクスを分析して、ライトサイジングの推奨を提供し、使われていないリソースを見つけます。EC2インスタンス、EC2 Auto Scalingグループ、EBSボリューム、Lambda関数などが対象です。",
 ["使用率を分析して、合う大きさを推奨＝AWS Compute Optimizer。"],["saa-q-cc-07"])
d=load(f'lessons/{CC}.json')
if 'aws-compute-optimizer' not in d['relatedServiceIds']: d['relatedServiceIds'].append('aws-compute-optimizer'); save(f'lessons/{CC}.json',d)
patch_lesson(B2,[SQ_,EC2Q,IMM],("【この教材でまだ扱っていない項目】",""),
 "【サービスクォータ】\nクォータ（上限）は、AWSアカウントの中で使えるリソースや操作の最大値です。サービスごとに既定値があり、多くはリージョンごとに適用されます。クォータを超えようとすると、リクエストは失敗します。障害のときに別の場所でリソースを増やす設計では、そのためのクォータが足りているかを確かめます。調整できるクォータは、Service Quotasで引き上げを申請できます。審査と承認には時間がかかるため、必要になる前に申請します。\n【イミュータブルインフラストラクチャ】\n本番のワークロードに、更新・セキュリティパッチ・設定の変更を「その場で」行わない考え方です。変更が必要なときは、変更を含んだ新しいリソース一式を、いまのリソースと並行してデプロイし、検証してから、通信を新しい側へ徐々に移します。環境ごとの違いや、設定のずれ（ドリフト）が減り、前の版が変更されないため、問題があればすぐに戻せます。AWS CloudFormationなどのInfrastructure as Codeで自動化します。\n【この教材でまだ扱っていない項目】\n試験ガイドには、スロットリングも挙げられています。公式情報の確認ができしだい追加します。Amazon RDS Proxyは、第3分野のデータベースのレッスンで扱っています。",
 ["クォータを超えるとリクエストは失敗する。Service Quotasで、前もって引き上げを申請する。","イミュータブルインフラストラクチャ＝その場で変更せず、新しいものを作って切り替える。すぐに戻せる。"],["saa-q-ha-16","saa-q-ha-17"],["service-quota","immutable-infrastructure"])

# ---- 比較表の空欄を、公式ドキュメントで確認できた分だけ埋める
def fill(gid,cells,srcs):
    g=load(f'comparisons/{gid}.json'); n=0
    for it in g['items']:
        for k,v in cells.get(it['key'],{}).items():
            assert k in it['values'],(gid,it['key'],k)
            if it['values'][k]!=v: it['values'][k]=v; n+=1
    addsrc(g,srcs); save(f'comparisons/{gid}.json',g); print(gid,n,'cells')
RET="GBあたりの取り出し料金がかかる"
fill('s3-storage-classes',{
 'standard':{'availability':'99.99%の可用性になるよう設計。3つ以上のアベイラビリティゾーンに保存','cost':'最小の保存期間や、取り出し料金はない。単価は公式の料金ページで確認する'},
 'intelligent':{'availability':'99.9%の可用性になるよう設計。3つ以上のアベイラビリティゾーンに保存','performance':'層を自動で移しても、性能への影響はない','operations':'アクセスのパターンに合わせて、層の移動が自動で行われる（運用の手間は小さい）','limits':'オブジェクトごとに、監視と自動化の料金がかかる（取り出し料金はない）。128 KB未満のオブジェクトは監視されず、常に高頻度アクセスの層に置かれる'},
 'ia':{'availability':'Standard-IAは99.9%（3つ以上のアベイラビリティゾーン）。One Zone-IAは99.5%（1つのアベイラビリティゾーンだけ）','performance':'ミリ秒でアクセスできる（S3 Standardと同様）','cost':RET+'。One Zone-IAは、Standard-IAより低コスト','limits':'最小の保存期間は30日。128 KB未満のオブジェクトは、128 KBとして課金される。One Zone-IAは、アベイラビリティゾーンの喪失に耐えられない'},
 'glacier-ir':{'availability':'99.9%の可用性になるよう設計。3つ以上のアベイラビリティゾーンに保存','cost':RET,'operations':'復元の操作は不要で、そのままアクセスできる','limits':'最小の保存期間は90日。128 KB未満のオブジェクトは、128 KBとして課金される'},
 'glacier-fr':{'availability':'99.99%（オブジェクトを復元したあと）。3つ以上のアベイラビリティゾーンに保存','cost':RET,'operations':'アクセスする前に、オブジェクトの復元が必要。取り出しにかかる時間は、数分から12時間'},
 'deep-archive':{'availability':'99.99%（オブジェクトを復元したあと）。3つ以上のアベイラビリティゾーンに保存','operations':'アクセスする前に、オブジェクトの復元が必要。取り出しにかかる時間は、9〜48時間','limits':'最小の保存期間は180日。取り出しに数時間以上かかる'},
},[S3C,S3G])
fill('vpc-endpoints',{
 'nat':{'availability':'各アベイラビリティゾーンのNATゲートウェイは、冗長性を持って実装されている。ゾーンに依存しない構成にするには、アベイラビリティゾーンごとに作成する','performance':'5 Gbpsの帯域に対応し、自動的に最大100 Gbpsまで拡張する','scalability':'種類やサイズを選ぶ必要がなく、自動的に拡張する','cost':'NATゲートウェイの数、利用時間、通過させたデータの量に応じて課金される'},
 'interface':{'cost':'時間あたりの料金と、処理したデータ量（GBあたり）の料金がかかる'},
},[NATC,NATB,C8])
fill('vpc-connectivity',{
 'privatelink':{'cost':'インターフェイスエンドポイントには、時間あたりの料金と、処理したデータ量（GBあたり）の料金がかかる'},
 'tgw':{'cost':'Transit Gatewayを通るデータには、データ処理の料金がかかる。そのほかの料金は、公式の料金ページで確認する'},
},[C8,EGR])
