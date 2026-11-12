from p4common import *
D2='2026-11-12'
HP={"title":"AWS料金体系の仕組み（AWSホワイトペーパー）","url":"https://docs.aws.amazon.com/ja_jp/whitepapers/latest/how-aws-pricing-works/how-aws-pricing-works.pdf"}
PR={"title":"AWS の料金（AWS公式 料金一覧）","url":"https://aws.amazon.com/jp/pricing/"}
PC={"title":"What is AWS Pricing Calculator?（AWS Pricing Calculator ユーザーガイド）","url":"https://docs.aws.amazon.com/pricing-calculator/latest/userguide/what-is-pricing-calculator.html"}
def load(p): return json.load(open(os.path.join(ROOT,p)))
def save(p,d): json.dump(d,open(os.path.join(ROOT,p),'w'),ensure_ascii=False,indent=2)
def addsrc(d,srcs):
    urls={s['url'] for s in d['sources']}
    d['sources']+=[s for s in srcs if s['url'] not in urls]; d['verifiedAt']=D2

# ---- サービスごとの公式の料金ページ（2026-11-12 に開いて確認できたものだけ）
P={
 "amazon-s3":("https://aws.amazon.com/jp/s3/pricing/","保存した量（ストレージクラスごと）、リクエストとデータの取り出し、データ転送、管理・分析の機能、レプリケーションなど。インターネットからS3への受信のデータ転送は無料です。","S3 料金（AWS公式）"),
 "amazon-ec2":("https://aws.amazon.com/jp/ec2/pricing/","インスタンスを動かした時間（秒単位、最低60秒）。インスタンスタイプと、購入オプション（オンデマンド、Savings Plans、スポットなど）で料金が変わります。","Amazon EC2 料金（AWS公式）"),
 "amazon-rds":("https://aws.amazon.com/jp/rds/pricing/","DBインスタンスを動かした時間、エンジンとインスタンスの大きさ、購入タイプ、確保したストレージ、バックアップ用の追加ストレージ、デプロイのタイプ（単一／複数のアベイラビリティゾーン）、データ転送など。","Amazon RDS 料金（AWS公式）"),
 "amazon-cloudfront":("https://aws.amazon.com/jp/cloudfront/pricing/","送信したデータの量、HTTP/HTTPSのリクエストの数など。前払いや長期契約は不要です。","Amazon CloudFront 料金（AWS公式）"),
 "amazon-sagemaker-ai":("https://aws.amazon.com/jp/sagemaker/pricing/",None,"Amazon SageMaker 料金（AWS公式）"),
 "aws-lambda":("https://aws.amazon.com/jp/lambda/pricing/","関数へのリクエストの数と、コードの実行にかかった時間。実行時間の料金は、関数に割り当てたメモリの量で変わります。無料利用枠があります。","AWS Lambda の料金（AWS公式）"),
 "amazon-sns":("https://aws.amazon.com/sns/pricing/","標準トピックは、APIリクエストの数と、配信先への配信の数。SNSへの受信のデータ転送は無料です。前払いや最低利用料はありません。","Amazon SNS Pricing（AWS公式）"),
 "amazon-dynamodb":("https://aws.amazon.com/dynamodb/pricing/","データの読み取り、書き込み、保存と、有効にしたオプションの機能。読み書きの料金は、キャパシティモード（オンデマンド／プロビジョンド）で決まり方が変わります。","Amazon DynamoDB Pricing（AWS公式）"),
 "aws-backup":("https://aws.amazon.com/backup/pricing/","使ったバックアップのストレージ、リージョンの間で転送したバックアップのデータ、復元したデータなど。最低料金や初期費用はありません。","AWS Backup Pricing（AWS公式）"),
 "amazon-efs":("https://aws.amazon.com/efs/pricing/","使ったストレージと、読み取り・書き込み・ストレージクラスの間の移動。最低料金や初期費用はありません。","Amazon EFS Pricing（AWS公式）"),
 "amazon-ebs":("https://aws.amazon.com/ebs/pricing/","確保した容量（GB／月）。使った量ではなく、確保した量に対して支払います。基準を超えるIOPSやスループットを確保すると、料金が加わります。","Amazon EBS Pricing（AWS公式）"),
 "aws-storage-gateway":("https://aws.amazon.com/storagegateway/pricing/",None,"AWS Storage Gateway Pricing（AWS公式）"),
 "aws-savings-plans":("https://aws.amazon.com/savingsplans/compute-pricing/",None,"Compute Savings Plans の料金（AWS公式）"),
}
n=0
for sid,(url,note,title) in P.items():
    d=load(f'services/{sid}.json'); d['pricingUrl']=url
    if note: d['pricingNote']=note
    d['volatile']=True
    addsrc(d,[{"title":title,"url":url}]+([HP] if sid in("amazon-ec2","amazon-rds","amazon-cloudfront","amazon-dynamodb","amazon-s3","aws-lambda") else []))
    save(f'services/{sid}.json',d); n+=1
print('pricingUrl',n)

# ---- 料金計算ツール
d=load('services/aws-pricing-calculator.json')
add="AWS Pricing Calculatorは、無料で使えるウェブベースの計画ツールです。構築する前に構成をモデル化したり、サービスの価格を調べたり、支出を計画したりするために使います。見積もりに、税は含まれません。"
if add not in d['exam']['description']: d['exam']['description']+=add
d['pricingUrl']="https://calculator.aws/"; d['pricingNote']="料金計算ツールそのものは、無料で使えます。"
addsrc(d,[PC,{"title":"AWS Pricing Calculator（AWS公式）","url":"https://calculator.aws/"}]); save('services/aws-pricing-calculator.json',d)

# ---- レッスン：データ転送（受信）と、料金の3つの基本
l=load('lessons/clf-pricing-models.json'); t=l['mechanism']['text']
old="インターネットからAWSへの受信の料金を含め、具体的な金額は公式の料金ページで確認してください。"
new="・インターネットからAWSへの受信：ほとんどの場合、料金はかかりません（例外があります）。\n具体的な金額は、公式の料金ページで確認してください。\n【料金の基本と、調べ方】\nAWSの料金は従量制で、使った分だけ支払います。最低料金や解約の料金はありません。基本になるコストの要因は、コンピューティング、ストレージ、外向きのデータ転送の3つです。\n料金を調べるときは、AWS公式の料金一覧から各サービスの料金ページを見ます。構成全体の費用は、無料のAWS Pricing Calculator（料金計算ツール）で見積もれます。見積もりに、税は含まれません。"
if old in t: t=t.replace(old,new)
l['mechanism']['text']=t
for pt in ["インターネットからAWSへの受信のデータ転送は、ほとんどの場合、無料。外向きのデータ転送に料金がかかる。","コストの3つの基本の要因＝コンピューティング、ストレージ、外向きのデータ転送。"]:
    if pt not in l['examPoints']: l['examPoints'].append(pt)
addsrc(l,[HP,PR,PC]); save('lessons/clf-pricing-models.json',l)
l=load('lessons/saa-cost-network.json'); t=l['mechanism']['text']
old="別のアベイラビリティゾーンの間、別のリージョンの間、インターネットへの送信には、料金がかかります。"
if old in t and "受信のデータ転送" not in t: t=t.replace(old,old+"インターネットからAWSへの受信のデータ転送は、ほとんどの場合、料金がかかりません。")
l['mechanism']['text']=t; addsrc(l,[HP]); save('lessons/saa-cost-network.json',l)

# ---- 問題（CLF 1問）
GC=[{"exam":"clf","version":"1.3"}]
x=q("clf-q-price-dt-in","clf-d4","clf-4-1","basic","single","standard",
 "ある企業は、オンプレミスにある大量のデータを、インターネット経由でAWSにアップロードします。AWSのデータ転送の料金についての説明として、正しいものはどれですか。",
 [("インターネットからAWSへの受信のデータ転送は、ほとんどの場合、料金がかからない",True,"AWSでは、受信のデータ転送には、ほとんどの場合、料金がかかりません。料金がかかるのは、主に外向き（AWSからの送信）のデータ転送です。",None),
  ("受信のデータ転送にも、送信と同じ料金がかかる",False,"受信と送信の料金は同じではありません。受信のデータ転送は、ほとんどの場合、料金がかかりません。","インターネット経由でAWSにアップロード"),
  ("データ転送の料金は、送受信の量にかかわらず、毎月の定額である",False,"AWSの料金は従量制です。外向きのデータ転送は、転送した量に応じて課金されます。","データ転送の料金についての説明"),
  ("データ転送は、送信も受信も、すべて無料である",False,"外向き（AWSからの送信）のデータ転送には、料金がかかります。コストの基本の要因の1つです。","データ転送の料金についての説明")],
 ["インターネット経由でAWSにアップロード","データ転送の料金"],"受信はほとんどの場合無料。外向きの送信に料金がかかる。",[HP,GD3],[],[L("clf-pricing-models")])
x['basedOnGuide']=GC; x['verifiedAt']=D2
for c in x['choices']:
    assert len(c['explanation'])>=20
    if not c['correct']: assert c['eliminatedBy'] in x['stem']
w('questions/clf-p8a.json',[x])
l=load('lessons/clf-pricing-models.json')
if x['id'] not in l['quizQuestionIds']: l['quizQuestionIds'].append(x['id']); save('lessons/clf-pricing-models.json',l)

# ---- 比較表：公式の料金情報で確認できた料金の欄
def fill(gid,cells,srcs):
    g=load(f'comparisons/{gid}.json'); n=0
    for it in g['items']:
        for k,v in cells.get(it['key'],{}).items():
            assert k in it['values'],(gid,it['key'],k)
            if it['values'][k]!=v: it['values'][k]=v; n+=1
    addsrc(g,srcs); save(f'comparisons/{gid}.json',g); print(gid,n)
ELB="ロードバランサーを動かした時間と、処理したデータの量が、料金に反映される。金額は公式の料金ページで確認する"
fill('load-balancers',{'alb':{'cost':ELB},'nlb':{'cost':ELB}},[HP])
fill('rds-ha',{'multi-az':{'cost':'デプロイのタイプ（単一／複数のアベイラビリティゾーン）は、RDSの料金を決める要素の1つ。金額は公式の料金ページで確認する'}},[HP])
fill('messaging',{'sns':{'cost':'標準トピックは、APIリクエストの数と、配信先への配信の数に基づく。前払いや最低利用料はない'}},[{"title":"Amazon SNS Pricing（AWS公式）","url":"https://aws.amazon.com/sns/pricing/"}])
fill('s3-storage-classes',{'standard':{'cost':'保存した量、リクエスト、データ転送などに料金がかかる。最小の保存期間や、取り出し料金はない。金額は公式の料金ページで確認する'}},[{"title":"S3 料金（AWS公式）","url":"https://aws.amazon.com/jp/s3/pricing/"}])
