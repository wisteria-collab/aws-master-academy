import json,glob,os
R='/home/claude/aws-master-academy/content/'; D='2026-11-12'
def load(p): return json.load(open(R+p))
def save(p,d): json.dump(d,open(R+p,'w'),ensure_ascii=False,indent=2); open(R+p,'a').write('\n')
def addsrc(d,title,url):
    if all(s['url']!=url for s in d['sources']): d['sources'].append({"title":title,"url":url})
    d['verifiedAt']=D
def sub(p,pairs,srcs=[]):
    s=open(R+p).read()
    for a,b in pairs:
        assert a in s,(p,a[:30]); s=s.replace(a,b)
    open(R+p,'w').write(s)
    if srcs:
        d=load(p)
        if isinstance(d,dict):
            for t,u in srcs: addsrc(d,t,u)
            save(p,d)
def qsrc(p,qid,srcs,fn=None):
    d=load(p)
    for q in d:
        if q['id']==qid:
            for t,u in srcs: addsrc(q,t,u)
            if fn: fn(q)
    save(p,d)
# ---- ElastiCache
EC=("Choosing an engine（Amazon ElastiCache ユーザーガイド）","https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/SelectEngine.html")
sub('services/amazon-elasticache.json',[("エンジンとしてRedis OSSとMemcachedに対応しています。","エンジンは、Valkey、Redis OSS、Memcachedの3種類から選べます。Memcachedは最も単純なキャッシュ向け、ValkeyとRedis OSSは複雑なデータ型などの高度な機能が必要なとき向けです。"),("エンジンはRedis OSSとMemcached。","エンジンはValkey、Redis OSS、Memcachedの3種類。")],[EC])
sub('comparisons/database.json',[("エンジンはRedis OSSとMemcached","エンジンはValkey、Redis OSS、Memcachedの3種類")],[EC])
sub('lessons/clf-database.json',[("エンジンはRedis OSSとMemcached。","エンジンはValkey、Redis OSS、Memcachedの3種類。")],[EC])
s=open(R+'questions/clf-batch4.json').read(); import re
i=s.index('"clf-q-db-04"'); seg=s[i:i+6000]; m=[x for x in re.findall(r'[^"。]*Redis OSS[^"。]*。',seg)]; print('db-04:',m)
# ---- CloudHSM
HS=("FIPS validation（AWS CloudHSM ユーザーガイド）","https://docs.aws.amazon.com/cloudhsm/latest/userguide/fips-validation.html")
NEW="現在のHSMのタイプ（hsm2m.medium）は、FIPS 140-3 レベル3の認証を受けています。以前のタイプ（hsm1.medium）はFIPS 140-2 レベル3の認証で、その証明書は2026年1月4日にNISTの過去の一覧（Historical list）へ移りました。"
sub('services/aws-cloudhsm.json',[("FIPS 140-2 レベル3の検証を受けた専用のHSMを使って、自分の暗号鍵を管理できます。","専用のHSMを使って、自分の暗号鍵を管理できます。"+NEW),("「専用のHSM」「FIPS 140-2 レベル3」が手がかり。","「専用のHSM」「FIPS 140-3 レベル3」が手がかり（以前のタイプはFIPS 140-2 レベル3）。")],[HS])
sub('lessons/saa-data-security.json',[("FIPS 140-2 レベル3の検証を受けた専用のHSMで、自分の暗号鍵を管理できます。","専用のHSMで、自分の暗号鍵を管理できます。"+NEW),("専用のHSM（FIPS 140-2 レベル3）＝AWS CloudHSM。","専用のHSM（現行はFIPS 140-3 レベル3）＝AWS CloudHSM。")],[HS])
sub('questions/saa-p4b.json',[("FIPS 140-2 レベル3の検証を受けた専用のHSMが必要です。","FIPS 140-3 レベル3の認証を受けた専用のHSMが必要です。"),("CloudHSMでは、FIPS 140-2 レベル3の検証を受けた専用のHSMを使って、自分の暗号鍵を管理できます。","CloudHSMでは、専用のHSMを使って、自分の暗号鍵を管理できます。現在のHSMのタイプ（hsm2m.medium）は、FIPS 140-3 レベル3の認証を受けています。以前のタイプ（hsm1.medium）は、FIPS 140-2 レベル3の認証でした。")])
qsrc('questions/saa-p4b.json','saa-q-data-04',[HS])
# ---- Snow Family
SN=("AWS Snowball Edge availability change（AWS Snowball Edge デベロッパーガイド）","https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html")
NOTE="AWS公式の案内（2026年11月12日に確認）では、AWS Snowball Edgeは新規の利用者には提供されておらず、Snow Familyの機器の新規の注文も受け付けていません。既存の利用者は引き続き使えます。代わりの方法として、オンラインの転送にはAWS DataSync、オフラインの転送にはAWS Data Transfer TerminalやAWSパートナーの製品、エッジでの処理にはAWS Outpostsが案内されています。試験ガイドにはSnow Familyの名前が載っているため、役割（大量のデータの物理的な輸送）は学んでおきます。"
d=load('services/aws-snow-family.json')
assert 'エクサバイト規模までのデータを、AWSとの間で物理的に輸送するのに役立ちます。' in d['exam']['description']
d['exam']['description']=d['exam']['description'].replace('エクサバイト規模までのデータを、AWSとの間で物理的に輸送するのに役立ちます。','大量のデータを、AWSとの間で物理的に輸送するためのサービスです。')+"現在は、新規の利用者には提供されていません（下の注意を参照）。"
d['exam']['points'].append("新規の利用者には提供されていない。現在の代わりの方法：オンライン＝AWS DataSync、オフライン＝AWS Data Transfer Terminal、エッジ＝AWS Outposts。")
d['cons'].append("新規の利用者は注文できない")
d['uncertainNote']=NOTE; d['volatile']=True; addsrc(d,*SN); save('services/aws-snow-family.json',d)
d=load('comparisons/data-transfer.json')
for it in d['items']:
    if it['key']=='snow':
        v=it['values']; assert v['data'].startswith('エクサバイト'); v['data']='機器にデータを入れて運ぶ'; v['scalability']='ネットワークでは運びにくい、大量のデータに対応する'
        v['limits']=v['limits']+'。新規の利用者には提供されていない'
        v['avoidWhen']=v['avoidWhen']+'。これから新しく使い始めるとき（新規の注文は受け付けていないため、AWS DataSyncやAWS Data Transfer Terminalを検討する）'
        v['availability']='新規の利用者には提供されていない。既存の利用者は引き続き使える'
d['uncertainNote']=NOTE; addsrc(d,*SN); save('comparisons/data-transfer.json',d)
d=load('lessons/saa-perf-data.json'); d['uncertainNote']=NOTE; addsrc(d,*SN)
a="・AWS Snow Family：大量のデータを、物理的な機器で輸送します。"; assert a in d['mechanism']['text']
d['mechanism']['text']=d['mechanism']['text'].replace(a,a+"現在は、新規の利用者には提供されていません。新しく始める場合、オンラインの転送にはAWS DataSync、オフラインの転送にはAWS Data Transfer Terminalが案内されています。")
save('lessons/saa-perf-data.json',d)
qsrc('questions/saa-p4d.json' if any(q['id']=='saa-q-di-04' for q in load('questions/saa-p4d.json')) else [f for f in map(os.path.basename,glob.glob(R+'questions/saa-*.json')) if any(q['id']=='saa-q-di-04' for q in load('questions/'+f))][0] and 'questions/'+[f for f in map(os.path.basename,glob.glob(R+'questions/saa-*.json')) if any(q['id']=='saa-q-di-04' for q in load('questions/'+f))][0],'saa-q-di-04',[SN],lambda q:q.__setitem__('uncertainNote',"AWS公式の案内（2026年11月12日に確認）では、Snow Familyの機器は新規の注文を受け付けていません。この問題は、試験ガイドに載っているサービスの役割を確認するためのものです。新しく始める場合の代わりの方法として、AWS DataSync（オンライン）やAWS Data Transfer Terminal（オフライン）が案内されています。"))
# ---- 料金
def note(sid,text,srcs=[],ref=None):
    p=f'services/{sid}.json'; d=load(p); d['pricingNote']=text
    if ref: d['pricingRefUrl']=ref
    for t,u in srcs: addsrc(d,t,u)
    d['verifiedAt']=D; save(p,d)
note('amazon-sagemaker-ai',"オンデマンドでは、最低料金や前払いはなく、ノートブック・トレーニング・リアルタイム推論などに使ったインスタンスの利用時間と、ストレージの量（GB）に応じて課金されます。サーバーレス推論は、選んだメモリの量にもとづくコンピューティングの時間（ミリ秒単位）と、処理したデータの量に応じて課金されます。一定の利用を約束して割引を受けるSageMaker Savings Plansもあります。最初のリソースを作成してから2か月間は、無料利用枠があります（2026年11月12日に確認）。",[("Amazon SageMaker AI の料金（AWS公式）","https://aws.amazon.com/jp/sagemaker/ai/pricing/")])
note('aws-savings-plans',"Savings Plansそのものに利用料はなく、「1時間あたりの利用額」を1年または3年約束する代わりに、対象の利用に割引料金が適用される仕組みです。約束した額を超えた分は、通常のオンデマンド料金で課金されます。種類ごとに対象が違います。Compute Savings PlansはEC2・Fargate・Lambda、EC2 Instance Savings Plansは選んだリージョンとインスタンスファミリーのEC2、SageMaker Savings PlansはSageMakerの対象のインスタンスの利用が対象です。データベース向けのDatabase Savings Plans（期間は1年のみ）もあります。支払い方法は、前払いなし・一部前払い・全額前払いから選べます（種類によります）。割引率は変わるため、公式のページで確認してください。",[("Savings Plans FAQs（AWS公式）","https://aws.amazon.com/savingsplans/faqs/")],"https://aws.amazon.com/savingsplans/faqs/")
note('aws-storage-gateway',"ゲートウェイの種類（ファイル、ボリューム、テープ）ごとに料金表があります。共通して、ゲートウェイとAWSの間で転送したデータの量に応じた料金がかかります。このほか、Amazon S3に保存したデータにはS3の料金、AWS Direct Connectを使う場合はその料金、ゲートウェイをAmazon EC2で動かす場合はEC2の料金、Amazon CloudWatchの料金が、別にかかります。種類ごとの保存やリクエストの料金の内訳は、公式の料金ページで確認してください（2026年11月12日に確認。内訳の表は、今回の確認では読み取れませんでした）。",[("AWS Storage Gateway の料金（AWS公式）","https://aws.amazon.com/jp/storagegateway/pricing/")])
d=load('services/aws-x-ray.json'); a="毎月、記録は最初の10万件、取得とスキャンは合わせて最初の100万件が無料です（2026年11月12日に確認。無料の範囲は変わることがあります）。"; assert a in d['pricingNote']
d['pricingNote']=d['pricingNote'].replace(a,"料金ページには、毎月、記録は最初の10万件、取得とスキャンは合わせて最初の100万件が無料と書かれています（2026年11月12日に確認）。適用の条件（アカウント単位かどうか、期間の制限があるかなど）は、確認できた範囲には書かれていませんでした。件数や条件は変わることがあるため、利用の前に公式の料金ページで確認してください。"); save('services/aws-x-ray.json',d)
d=load('services/aws-marketplace.json')
d['pricingNote']="購入者から見た料金のポイントです。①無料の製品と、有料の製品があります。②有料の製品の料金モデルには、時間単位、月額、年額、複数年の契約、BYOL（すでに持っているライセンスの持ち込み）などがあります。無料トライアルが付く製品や、個別の条件で契約するプライベートオファーもあります。③料金は製品ごとに違うため、買う前に、その製品のページで確認します。④購入した製品の料金は、AWSの請求にまとめて含まれます。⑤製品を動かすためのAWSリソース（Amazon EC2など）の料金は、製品の料金とは別にかかります。この説明は、AWS Marketplaceの出品者向けの公式ガイドにある料金モデルの記載をもとに、購入者向けに要約したものです。"
save('services/aws-marketplace.json',d)
# ---- 比較表の料金
SG=("Control traffic to your AWS resources using security groups（Amazon VPC ユーザーガイド）","https://docs.aws.amazon.com/ja_jp/vpc/latest/userguide/vpc-security-groups.html")
NA=("Control subnet traffic with network access control lists（Amazon VPC ユーザーガイド）","https://docs.aws.amazon.com/ja_jp/vpc/latest/userguide/vpc-network-acls.html")
RP=("Amazon RDS の料金（AWS公式）","https://aws.amazon.com/jp/rds/pricing/")
SGW=("AWS Storage Gateway の料金（AWS公式）","https://aws.amazon.com/jp/storagegateway/pricing/")
def cell(cid,key,ax,val,srcs,must_blank=True):
    d=load(f'comparisons/{cid}.json')
    for it in d['items']:
        if it['key']==key:
            if must_blank: assert it['values'][ax].startswith('この教材の出典'),(cid,key)
            it['values'][ax]=val
    for s in srcs: addsrc(d,*s)
    save(f'comparisons/{cid}.json',d)
cell('sg-nacl','sg','cost','追加料金なしで使用できる',[SG])
cell('sg-nacl','nacl','cost','追加料金なしで使用できる',[NA])
cell('data-transfer','storage-gateway','cost','ゲートウェイの種類ごとに料金表がある。ゲートウェイとAWSの間で転送したデータの量に応じて課金される。S3に保存したデータにはS3の料金が別にかかる。金額は公式の料金ページで確認する',[SGW])
cell('rds-ha','multi-region','cost','リージョンをまたぐスナップショットのコピーや自動バックアップでは、リージョン間のデータ転送に課金される。コピー先のリージョンでは、保存の料金がかかる。金額は公式の料金ページで確認する',[RP])
d=load('comparisons/rds-ha.json')
for it in d['items']:
    if it['key']=='multi-az' and '無料' not in it['values']['cost']: it['values']['cost']=it['values']['cost'].replace('金額は公式','マルチAZの複製のための、アベイラビリティゾーンの間のデータ転送は無料。金額は公式')
save('comparisons/rds-ha.json',d)
print('done')
