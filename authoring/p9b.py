import json,glob
R='/home/claude/aws-master-academy/content/'
D='2026-11-12'
def load(p): return json.load(open(R+p))
def save(p,d): json.dump(d,open(R+p,'w'),ensure_ascii=False,indent=2); open(R+p,'a').write('\n')
def addsrc(d,title,url):
    if all(s['url']!=url for s in d['sources']): d['sources'].append({"title":title,"url":url})
    d['verifiedAt']=D
# --- 料金（追加料金なしと確認できたもの）
free={
 'aws-iam':("追加料金なしで利用できます。","AWS Identity and Access Management (IAM) FAQs（AWS公式）","https://aws.amazon.com/iam/faqs/"),
 'aws-organizations':("追加料金なしで利用できます。課金されるのは、メンバーアカウントのユーザーやロールが使ったAWSリソースの分だけです。","Billing and pricing for AWS Organizations（AWS Organizations ユーザーガイド）","https://docs.aws.amazon.com/organizations/latest/userguide/pricing.html"),
 'aws-iam-identity-center':("追加料金なしで利用できます。","AWS IAM and AWS IAM Identity Center（AWS公式の比較ページ）","https://aws.amazon.com/compare/iam-and-iam-identity-center/"),
 'aws-health-dashboard':("すべてのAWSの利用者が、追加料金なしで利用できます。","What is AWS Health?（AWS Health ユーザーガイド）","https://docs.aws.amazon.com/health/latest/ug/what-is-aws-health.html"),
 'aws-artifact':("追加料金なしで利用できます。","Accept a BAA with AWS for all accounts in your organization（AWS Security Blog）","https://aws.amazon.com/blogs/security/accept-a-baa-with-aws-for-all-accounts-in-your-organization/"),
 'aws-trusted-advisor':("使えるチェックの範囲は、契約しているAWSサポートのプランによって変わります。","AWS Trusted Advisor（AWS Support ユーザーガイド）","https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html"),
}
for sid,(note,t,u) in free.items():
    p=f'services/{sid}.json'; d=load(p); d['pricingNote']=note; addsrc(d,t,u); save(p,d)
# --- サポートプランの変更（公式の告知）
PLAN="AWS公式のドキュメント（2026年11月12日に確認）では、現在のプランはベーシック、AWS Business Support+、AWS Enterprise Support、AWS Unified Operationsと案内されています。デベロッパー、ビジネス、Enterprise On-Rampの各プランは2027年1月1日に提供終了と告知されています。このアプリは試験ガイド（バージョン1.3）のプラン名に合わせています。受験前に、公式の最新情報を確認してください。"
PS=("AWS Support Plans（AWS Support ユーザーガイド）","https://docs.aws.amazon.com/awssupport/latest/user/aws-support-plans.html")
for p in ['lessons/clf-support-plans.json','services/aws-support.json','services/aws-trusted-advisor.json']:
    d=load(p); d['uncertainNote']=PLAN; addsrc(d,*PS); save(p,d)
# --- 比較表
EV=("Modify an Amazon EBS volume using Elastic Volumes operations（Amazon EBS ユーザーガイド）","https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html")
PQ=("AWS PrivateLink quotas（AWS PrivateLink ガイド）","https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-limits-endpoints.html")
PI=("Access an AWS service using an interface VPC endpoint（AWS PrivateLink ガイド）","https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html")
PG=("Guidance for Network Connectivity on AWS（AWS公式）","https://docs.aws.amazon.com/solutions/network-connectivity-on-aws/")
ssd="Elastic Volumesにより、対応するインスタンスでは、デタッチや再起動をせずに、サイズの拡張、種類の変更、性能（IOPS）の調整ができる"
hdd="Elastic Volumesにより、対応するインスタンスでは、デタッチや再起動をせずに、サイズの拡張と種類の変更ができる"
perf="既定で、アベイラビリティゾーンごとに最大10 Gbps。自動的に最大100 Gbpsまで拡張する"
scal="通信量に応じて、帯域が自動的に拡張される。さらに高いスループットが必要なときは、AWSサポートに相談する"
avail="選んだサブネットごとに、エンドポイント用のネットワークインターフェイスが作られる。高可用性のために、複数のアベイラビリティゾーンのサブネットを選ぶ"
fills={
 'ebs-volume-types':({('gp3','scalability'):ssd,('io2','scalability'):ssd,('st1','scalability'):hdd,('sc1','scalability'):hdd},[EV]),
 'vpc-endpoints':({('interface','performance'):perf,('interface','scalability'):scal,('interface','availability'):avail},[PQ,PI,PG]),
 'vpc-connectivity':({('privatelink','performance'):perf,('privatelink','scalability'):scal,('privatelink','availability'):avail},[PQ,PI,PG]),
}
n=0
for cid,(cells,srcs) in fills.items():
    p=f'comparisons/{cid}.json'; d=load(p)
    for it in d['items']:
        for (k,ax),v in cells.items():
            if it['key']==k:
                assert it['values'][ax].startswith('この教材の出典には記載'),(cid,k,ax); it['values'][ax]=v; n+=1
    for s in srcs: addsrc(d,*s)
    save(p,d)
print('cells',n)
# --- スロットリング
TH=("Throttle requests to your REST APIs for better throughput in API Gateway（Amazon API Gateway デベロッパーガイド）","https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html")
TW=("REL05-BP02 Throttle requests（AWS Well-Architected Framework）","https://docs.aws.amazon.com/wellarchitected/2025-02-25/framework/rel_mitigate_interaction_failure_throttle_requests.html")
p='lessons/saa-ha-ft.json'; d=load(p)
d['mechanism']['text']+="\n【スロットリング】\n受け付けるリクエストの量に上限を設けて、処理しきれない分を断る仕組みです。サービスが、想定を超える量のリクエストで押しつぶされるのを防ぎます。Amazon API Gatewayは「トークンバケット」という方式で、1秒あたりのリクエスト数（レート）と、一時的な集中（バースト）を調べます。上限を超えたリクエストには、429 Too Many Requestsというエラーを返します。上限は、アカウント全体（リージョンごと）、ステージやメソッドごと、使用量プランとAPIキーを使ったクライアントごと、に設定できます。断られた側は、あとで再試行します。すぐに処理しなくてよいものは、Amazon SQSなどのキューにためて、流量をならす方法もあります。なお、API Gatewayのスロットリングは目標値であり、厳密な上限ではありません。費用の管理やアクセスの遮断には、AWS BudgetsやAWS WAFを使います。"
d['examPoints'].append("スロットリング＝リクエストの量に上限を設けてサービスを守る。API Gatewayは上限を超えると429エラーを返す。クライアントごとの上限は使用量プランで設定する。")
d.pop('uncertainNote',None); addsrc(d,*TH); addsrc(d,*TW)
if 'throttling' not in d['glossaryTermIds']: d['glossaryTermIds'].append('throttling')
save(p,d)
p='lessons/saa-perf-compute.json'; d=load(p); d.pop('uncertainNote',None); save(p,d)
g=load('glossary/terms.json')
if all(t['id']!='throttling' for t in g):
    g.append({"id":"throttling","status":"verified","sources":[{"title":TH[0],"url":TH[1]},{"title":TW[0],"url":TW[1]}],"verifiedAt":D,"basedOnGuide":[{"exam":"saa","version":"1.1"}],"term":"スロットリング","description":"受け付けるリクエストの量に上限を設け、超えた分を断る仕組みです。サービスが大量のリクエストで押しつぶされるのを防ぎます。Amazon API Gatewayでは、上限を超えたリクエストに429 Too Many Requestsのエラーを返します。","plain":"人気店の「入場制限」のようなものです。店内がいっぱいになったら、入口でいったん待ってもらい、店の中が混乱しないようにします。","example":"APIに1秒あたりの上限を設定し、特定の利用者からの大量のリクエストで、ほかの利用者が使えなくなるのを防ぐ。","serviceIds":["amazon-api-gateway"]})
    save('glossary/terms.json',g)
