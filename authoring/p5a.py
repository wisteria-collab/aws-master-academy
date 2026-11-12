from p4common import *
D2='2026-11-12'
LS=lambda *ids: list({s['url']:s for i in ids for s in json.load(open(os.path.join(ROOT,'lessons',i+'.json')))['sources']}.values())
def tmeta(id,src): return {"id":id,"status":"verified","sources":src,"verifiedAt":D2,"basedOnGuide":GS}
def N(id,kind,label,x,y,sid=None,note=None,w=None,h=None,parent=None):
    d={"id":id,"kind":kind,"label":label,"x":x,"y":y}
    if sid: d["serviceId"]=sid
    if note: d["note"]=note
    if w: d["width"]=w
    if h: d["height"]=h
    if parent: d["parentId"]=parent
    return d
def E_(id,a,b,label=None):
    d={"id":id,"from":a,"to":b}
    if label: d["label"]=label
    return d
G=lambda id,label,x,y,w,h,parent=None: N(id,"group",label,x,y,None,None,w,h,parent)
U=lambda note="アプリケーションを使う人です。インターネットからアクセスします。": N("user","actor","利用者",136,8,None,note,88,36)

T=[
 {**tmeta("tpl-static-website",LS("clf-global-edge","saa-perf-network","saa-cost-network")),"title":"静的ウェブサイトの配信","order":1,
  "summary":"画像やHTMLなどの変わらないファイルを、世界中の利用者に速く届ける、最も基本の構成です。サーバーを1台も管理しません。",
  "diagram":{"nodes":[U(),
    N("r53","service","Amazon Route 53",16,96,"amazon-route-53","www.example.comのような名前を、接続先に変換して、利用者を案内します（DNS）。"),
    N("cf","service","Amazon CloudFront",240,96,"amazon-cloudfront","利用者に近いエッジロケーションにコンテンツをキャッシュして配信します。同じファイルを、何度もオリジンから取りに行かずに済みます。"),
    N("s3","service","Amazon S3",240,196,"amazon-s3","コンテンツの元の置き場所（オリジン）です。ファイルをオブジェクトとして保存します。")],
   "edges":[E_("e1","user","r53","①名前を調べる"),E_("e2","user","cf","②リクエスト"),E_("e3","cf","s3","③なければ取得")]},
  "flow":["利用者が、サイトの名前を使ってアクセスします。Route 53が、名前を接続先に変換します。","リクエストは、遅延が最も小さいエッジロケーションに振り分けられます。","エッジロケーションにキャッシュがあれば、そこから返します。なければ、オリジンのS3から取得して返します。"],
  "explanation":"【サーバーを持たない】\nファイルの保存はS3、配信はCloudFrontに任せるため、管理するサーバーがありません。\n【速く届ける】\nCloudFrontは、エッジロケーションと呼ばれる世界各地の拠点のネットワークを通じて、コンテンツを配信します。利用者に近い場所から返すため、表示が速くなります。\n【オリジンからの転送を減らす】\n同じコンテンツを何度も配信するとき、キャッシュから返すことで、オリジンからのデータ転送を減らせます。",
  "points":["静的なコンテンツを世界中に速く配信＝CloudFront（キャッシュ）＋S3（オリジン）。","名前を接続先に変換して案内する＝Route 53（DNS）。","CloudFrontのオリジンには、S3、Elastic Load Balancing、EC2などを指定できる。"],
  "relatedLessonIds":["clf-global-edge","saa-perf-network","saa-cost-network"]},
 {**tmeta("tpl-ha-web-3tier",LS("saa-ha-ft","saa-secure-workloads","saa-scalable-loose")),"title":"可用性の高い3層ウェブアプリケーション","order":2,
  "summary":"ウェブ・アプリケーション・データベースの3層を、2つのアベイラビリティゾーンにまたがって配置する、SAAで最もよく出る構成です。",
  "diagram":{"nodes":[U(),
    G("vpc","VPC",8,58,344,330),
    N("alb","service","Application Load Balancer",116,80,"elastic-load-balancing","インターネットからの入口です。パブリックサブネットに置き、通信を複数のアベイラビリティゾーンのインスタンスに分散します。",128,44,"vpc"),
    G("aza","アベイラビリティゾーン A",16,140,160,240,"vpc"),G("azc","アベイラビリティゾーン C",184,140,160,240,"vpc"),
    G("appa","プライベート（アプリ）",24,162,144,90,"aza"),G("appc","プライベート（アプリ）",192,162,144,90,"azc"),
    G("dba","プライベート（DB）",24,260,144,112,"aza"),G("dbc","プライベート（DB）",192,260,144,112,"azc"),
    N("ec2a","service","EC2（Auto Scaling）",40,192,"amazon-ec2-auto-scaling","アプリケーションを動かすサーバーです。Auto Scalingが、需要に合わせて台数を自動的に増減します。インターネットから直接アクセスされないよう、プライベートサブネットに置きます。",112,44,"appa"),
    N("ec2c","service","EC2（Auto Scaling）",208,192,"amazon-ec2-auto-scaling","アベイラビリティゾーンAと同じ役割のサーバーです。片方のゾーンに障害が起きても、もう片方で処理を続けられます。",112,44,"appc"),
    N("rdsp","service","RDS プライマリ",32,304,"amazon-rds","ふだん読み書きを受け付けるデータベースです。マルチAZ配置にしています。",104,44,"dba"),
    N("rdss","service","RDS スタンバイ",224,304,"amazon-rds","別のアベイラビリティゾーンに、同期で維持される予備です。プライマリに問題が検出されると、自動でフェイルオーバーします。",104,44,"dbc")],
   "edges":[E_("e1","user","alb","HTTPS"),E_("e2","alb","ec2a"),E_("e3","alb","ec2c"),E_("e4","ec2a","rdsp"),E_("e5","ec2c","rdsp"),E_("e6","rdsp","rdss","同期の複製")]},
  "flow":["利用者のリクエストを、ロードバランサーが受け取ります。","ロードバランサーが、2つのアベイラビリティゾーンのEC2インスタンスに通信を分散します。","EC2インスタンスが、データベースのプライマリを読み書きします。","プライマリの内容は、別のアベイラビリティゾーンのスタンバイに、同期で複製されます。"],
  "explanation":"【単一障害点をなくす】\nそこが止まると全体が止まる部分をなくすために、EC2インスタンスを複数のアベイラビリティゾーンに配置し、Elastic Load Balancingで通信を分散します。\n【データベースの高可用性】\nAmazon RDSのマルチAZ配置は、別のアベイラビリティゾーンに、同期のスタンバイを自動的に維持します。問題が検出されると、自動でフェイルオーバーします。\n【層ごとに守る】\nインターネットから直接アクセスされるべきでないインスタンスは、プライベートサブネットに置きます。入口になるロードバランサーだけを、パブリックサブネットに置きます。\n【需要に合わせる】\nAmazon EC2 Auto Scalingが、定義した条件に従って、インスタンスを自動的に追加・削除します。",
  "points":["単一障害点をなくす＝EC2は複数のアベイラビリティゾーン＋ロードバランサー、RDSはマルチAZ配置。","マルチAZ配置＝同期のスタンバイ・自動フェイルオーバー（目的は高可用性）。読み取りのスケーリングはリードレプリカ。","入口（ロードバランサー）だけパブリックサブネット。アプリケーションとデータベースはプライベートサブネット。","この図では、パブリックサブネットとNATゲートウェイの枠を省略している。"],
  "relatedLessonIds":["saa-ha-ft","saa-secure-workloads","saa-scalable-loose"]},
 {**tmeta("tpl-serverless-api",LS("saa-scalable-loose","saa-secure-workloads","saa-perf-database")),"title":"サーバーレスのAPI","order":3,
  "summary":"モバイルアプリやウェブアプリのバックエンドを、サーバーを1台も管理せずに作る構成です。使われた分だけ処理が動きます。",
  "diagram":{"nodes":[U("モバイルアプリやウェブアプリの利用者です。"),
    N("cog","service","Amazon Cognito",12,96,"amazon-cognito","アプリの利用者の、サインアップとサインインを受け持ちます。"),
    N("api","service","Amazon API Gateway",236,96,"amazon-api-gateway","バックエンドへの「正面玄関」となるAPIです。アプリからのリクエストを受け付けます。",112),
    N("fn","service","AWS Lambda",240,182,"aws-lambda","リクエストに応じて、コードを実行します。サーバーの管理は不要で、実行した分だけ支払います。"),
    N("ddb","service","Amazon DynamoDB",240,268,"amazon-dynamodb","データを保存する、サーバーの管理が不要なNoSQLデータベースです。")],
   "edges":[E_("e1","user","cog","①サインイン"),E_("e2","user","api","②リクエスト"),E_("e3","api","fn","③実行"),E_("e4","fn","ddb","④読み書き")]},
  "flow":["利用者が、Cognitoでサインインします。","アプリが、API Gatewayにリクエストを送ります。","API Gatewayが、Lambdaのコードを呼び出します。","Lambdaが、DynamoDBのデータを読み書きして、結果を返します。"],
  "explanation":"【サーバーを管理しない】\nAPI Gatewayは、バックエンドへの「正面玄関」となるAPIを作成・公開する、フルマネージドのサービスです。Lambdaは、サーバーを管理せずにコードを実行できます。DynamoDBも、サーバーの管理が不要です。\n【使った分だけ】\nLambdaは、実行した分だけ支払います。たまにしか使われないAPIでも、待機しているサーバーの料金がかかりません。\n【利用者の認証】\nCognitoで、アプリにサインアップとサインインの機能を追加します。",
  "points":["サーバーを管理しないAPI＝API Gateway＋Lambda。データはDynamoDB。","アプリの利用者のサインアップ・サインイン＝Cognito。","たまにしか動かない処理は、実行した分だけ支払うLambdaが向く。"],
  "relatedLessonIds":["saa-scalable-loose","saa-secure-workloads","saa-cost-compute"]},
 {**tmeta("tpl-decoupled-queue",LS("saa-scalable-loose","saa-perf-compute")),"title":"キューで疎結合にした処理","order":4,
  "summary":"依頼を受け付ける層と、時間のかかる処理を行う層の間に、キューをはさむ構成です。依頼が急に増えても、受け付けが止まりません。",
  "diagram":{"nodes":[U("処理を依頼する人です（例：動画の変換を依頼する）。"),
    N("web","service","EC2（ウェブ層）",124,84,"amazon-ec2","依頼を受け付けて、キューにメッセージを入れます。処理の完了を待たずに、次の依頼を受け付けられます。",112),
    N("sqs","service","Amazon SQS",128,170,"amazon-sqs","依頼のメッセージをためておくキューです。処理が追いつかない間も、メッセージはキューにたまるため、失われません。"),
    N("wrk","service","EC2（処理層）",124,256,"amazon-ec2-auto-scaling","キューからメッセージを自分のペースで取り出して、処理します。キューの状況に応じて、Auto Scalingで台数を増減します。",112),
    N("s3","service","Amazon S3",128,342,"amazon-s3","処理の結果のファイルを保存します。")],
   "edges":[E_("e1","user","web","依頼"),E_("e2","web","sqs","メッセージを入れる"),E_("e3","wrk","sqs","取り出す"),E_("e4","wrk","s3","結果を保存")]},
  "flow":["利用者が、ウェブ層に処理を依頼します。","ウェブ層が、依頼の内容をメッセージとして、SQSのキューに入れます。","処理層が、キューからメッセージを取り出して、処理します。","処理層が、結果をS3に保存します。"],
  "explanation":"【直接呼び出さない】\nウェブ層が処理層を直接呼び出すと、処理層の遅れや障害が、そのまま受け付けに影響します。間にキューを置くと、2つの層を疎結合にできます。\n【それぞれが独立してスケールする】\nキューを置くと、それぞれの層が独立してスケールできます。処理が追いつかない依頼はキューにたまり、処理層を増やすことで消化できます。\n【メッセージが失われない】\n受け取る側は、自分のペースでメッセージを取り出して処理できます。処理が追いつかない間も、メッセージはキューにたまります。",
  "points":["2つの層の間にキュー（SQS）を置く＝疎結合。片方の遅れや障害が、もう片方に広がりにくい。","処理層は、キューの状況に応じてスケールさせる。","1つのメッセージを複数の宛先に同時に配信したいときは、SNSを使う。"],
  "relatedLessonIds":["saa-scalable-loose","saa-perf-compute"]},
]
for t in T: w(f"diagrams/{t['id']}.json",t)
