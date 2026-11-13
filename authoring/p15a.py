import json,glob
C='/home/claude/aws-master-academy/content/'; D='2026-11-13'
def ld(p): return json.load(open(C+p))
def sv(p,d): json.dump(d,open(C+p,'w'),ensure_ascii=False,indent=2); open(C+p,'a').write('\n')
def rep(s,a,b):
    assert a in s,(a[:30]); return s.replace(a,b)
LW=("What is AWS Lambda?（AWS Lambda デベロッパーガイド）","https://docs.aws.amazon.com/lambda/latest/dg/welcome.html")
LP=("AWS Lambda pricing（AWS公式・英語）","https://aws.amazon.com/en/lambda/pricing/")
# --- Lambda: 2026年に関数の種類が増えたため、課金の説明を公式の料金ページに合わせる
p='services/aws-lambda.json'; d=ld(p)
d['beginner']['description']="プログラムのコードをアップロードしておくと、必要なときに自動で実行されます。イベントをきっかけに動く通常の関数は、呼び出された回数と実行した時間で料金が決まります。"
d['exam']['description']=rep(d['exam']['description'],"使用したコンピューティング時間に対してのみ料金を支払い、コードが実行されていないときは料金が発生しません。","イベントに応じて動く関数（イベント関数）は、リクエストの数と実行時間で課金されます。")
d['exam']['points'][2]="イベント関数の料金は、リクエストの数と実行時間（実行していない間に実行時間の料金はかからない）。"
d['pros'][1]="イベント関数は、呼び出しの回数と実行時間に応じた支払い"
d['pricingNote']="イベント関数は、リクエストの数と実行時間（割り当てたメモリの量で変わる）。イベント関数には無料利用枠があります。2026年に加わったWeb関数は、リクエスト、アクティブなCPU時間、実行環境のメモリ（リクエストの間の時間も含む）で課金されます。MicroVMsは、実行中の基本のコンピューティングと、スナップショットの読み書き・保存などで課金されます。"
d['pricingUrl']=LP[1]
d['sources']=[{"title":t,"url":u} for t,u in (LW,LP)]+[s for s in d['sources'] if s['url']!='https://aws.amazon.com/jp/lambda/pricing/']
d['verifiedAt']=D; sv(p,d)
p='comparisons/compute.json'; s=open(C+p).read()
s=rep(s,"使用したコンピューティング時間の分だけ支払う。実行していないときは料金がかからない。","イベント関数は、リクエストの数と実行時間で支払う。")
s=rep(s,'"note": "実行した時間の分だけ料金がかかります。"','"note": "イベント関数は、リクエストの数と実行時間で料金がかかります。"')
open(C+p,'w').write(s)
p='lessons/clf-compute.json'; s=open(C+p).read()
s=rep(s,"Lambdaは、実行した時間の分だけ料金がかかり、実行していないときは料金がかからない。","Lambdaのイベント関数は、リクエストの数と実行時間で料金がかかる（実行していない間に実行時間の料金はかからない）。")
open(C+p,'w').write(s)
NEWX="イベントに応じて動く関数は、リクエストの数と実行時間で課金されるため、処理が動いていない間に実行時間の料金はかかりません。"
for p,a in (('questions/clf-batch2.json',"使用したコンピューティング時間に対してのみ料金を支払い、コードが実行されていないときは料金が発生しません。"),('questions/clf-p4a.json',"使用したコンピューティング時間の分だけ支払い、コードが実行されていないときは料金が発生しません。")):
    s=open(C+p).read(); s=rep(s,a,NEWX); open(C+p,'w').write(s)
# --- Artifact: 料金の根拠を2019年のブログから現行のユーザーガイドへ
AR=("What is AWS Artifact?（AWS Artifact ユーザーガイド）","https://docs.aws.amazon.com/artifact/latest/ug/what-is-aws-artifact.html")
p='services/aws-artifact.json'; d=ld(p)
d['pricingRefUrl']=AR[1]
d['sources']=[{"title":AR[0],"url":AR[1]}]+[s for s in d['sources'] if 'blogs' not in s['url']]
d['verifiedAt']=D; sv(p,d)
# --- CLF問題の個別出典
G='https://docs.aws.amazon.com/'
U={
'ath':("What is Amazon Athena?（Amazon Athena ユーザーガイド）",G+"athena/latest/ug/what-is.html"),
'aur':("What is Amazon Aurora?（Amazon Aurora ユーザーガイド）",G+"AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html"),
'cw':("What is Amazon CloudWatch?（Amazon CloudWatch ユーザーガイド）",G+"AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html"),
'con':("What is Amazon Connect?（Amazon Connect 管理者ガイド）",G+"connect/latest/adminguide/what-is-amazon-connect.html"),
'ddb':("What is Amazon DynamoDB?（Amazon DynamoDB デベロッパーガイド）",G+"amazondynamodb/latest/developerguide/Introduction.html"),
'ecs':("What is Amazon Elastic Container Service?（Fargateを含む・Amazon ECS デベロッパーガイド）",G+"AmazonECS/latest/developerguide/Welcome.html"),
'eks':("What is Amazon EKS?（Amazon EKS ユーザーガイド）",G+"eks/latest/userguide/what-is-eks.html"),
'eb':("What is Amazon EventBridge?（Amazon EventBridge ユーザーガイド）",G+"eventbridge/latest/userguide/eb-what-is.html"),
'fsx':("What is FSx for Windows File Server?（Amazon FSx ユーザーガイド）",G+"fsx/latest/WindowsGuide/what-is.html"),
'gd':("Overview（Amazon GuardDuty ユーザーガイド）",G+"guardduty/latest/ug/protection-plans-overview.html"),
'ins':("What is Amazon Inspector?（Amazon Inspector ユーザーガイド）",G+"inspector/latest/user/what-is-inspector.html"),
'rds':("Welcome（Amazon RDS APIリファレンス）",G+"AmazonRDS/latest/APIReference/Welcome.html"),
'r53':("What is Amazon Route 53?（Amazon Route 53 デベロッパーガイド）",G+"Route53/latest/DeveloperGuide/Welcome.html"),
'sm':("What is Amazon SageMaker AI?（Amazon SageMaker AI デベロッパーガイド）",G+"sagemaker/latest/dg/whatis.html"),
'sns':("What is Amazon SNS?（Amazon SNS デベロッパーガイド）",G+"sns/latest/dg/welcome.html"),
'ws':("What is Amazon WorkSpaces?（Amazon WorkSpaces 管理ガイド）",G+"workspaces/latest/adminguide/amazon-workspaces.html"),
'art':AR,
'ct':("How CloudTrail works（AWS CloudTrail ユーザーガイド）",G+"awscloudtrail/latest/userguide/how-cloudtrail-works.html"),
'cp':("What is AWS CodePipeline?（AWS CodePipeline ユーザーガイド）",G+"codepipeline/latest/userguide/welcome.html"),
'cfg':("What Is AWS Config?（AWS Config デベロッパーガイド）",G+"config/latest/developerguide/WhatIsConfig.html"),
'dms':("What is AWS Database Migration Service?（AWS DMS ユーザーガイド）",G+"dms/latest/userguide/Welcome.html"),
'waf':("What are AWS WAF, AWS Shield Advanced, AWS Shield network security director and AWS Firewall Manager?（AWS WAF デベロッパーガイド）",G+"waf/latest/developerguide/what-is-aws-waf.html"),
'ga':("What is AWS Global Accelerator?（AWS Global Accelerator デベロッパーガイド）",G+"global-accelerator/latest/dg/what-is-global-accelerator.html"),
'glue':("What is AWS Glue?（AWS Glue デベロッパーガイド）",G+"glue/latest/dg/what-is-glue.html"),
'iam':("What is IAM?（IAM ユーザーガイド）",G+"IAM/latest/UserGuide/introduction.html"),
'iot':("Learn more about AWS IoT（AWS IoT Core デベロッパーガイド）",G+"iot/latest/developerguide/aws-iot-learn-more.html"),
'mp':("What is AWS Marketplace?（AWS Marketplace 購入者ガイド）",G+"marketplace/latest/userguide/what-is-marketplace.html"),
'sec':("What is AWS Secrets Manager?（AWS Secrets Manager ユーザーガイド）",G+"secretsmanager/latest/userguide/intro.html"),
'sh':("AWS WAF or AWS Shield?（AWS Decision Guides）",G+"decision-guides/latest/decision-guides/waf-or-shield.html"),
's3':("What is Amazon S3?（Amazon S3 ユーザーガイド）",G+"AmazonS3/latest/userguide/Welcome.html"),
'ebs':("What is Amazon EBS?（Amazon EBS ユーザーガイド）",G+"ebs/latest/userguide/what-is-ebs.html"),
'asg':("What is Amazon EC2 Auto Scaling?（Amazon EC2 Auto Scaling ユーザーガイド）",G+"autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html"),
'elb':("What is Elastic Load Balancing?（Elastic Load Balancing ユーザーガイド）",G+"elasticloadbalancing/latest/userguide/what-is-load-balancing.html"),
'lam':LW,'lamp':LP,
'ec':("What is Amazon ElastiCache?（Amazon ElastiCache ユーザーガイド）",G+"AmazonElastiCache/latest/red-ug/WhatIs.html"),
'sqs':("What is Amazon Simple Queue Service?（Amazon SQS デベロッパーガイド）",G+"AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html"),
'kds':("What is Amazon Kinesis Data Streams?（Amazon Kinesis Data Streams デベロッパーガイド）",G+"streams/latest/dev/introduction.html"),
'acm':("What is AWS Certificate Manager?（AWS Certificate Manager ユーザーガイド）",G+"acm/latest/userguide/acm-overview.html"),
'vpn':("What is AWS Site-to-Site VPN?（AWS Site-to-Site VPN ユーザーガイド）",G+"vpn/latest/s2svpn/VPC_VPN.html"),
}
M={'ana-01':['ath'],'db-02':['ddb'],'shared-06':['ddb'],'comp-05':['ecs'],'cmp-train-02':['ecs'],'comp-06':['eks'],'cmp-train-03':['eks'],
'sec-04':['ins'],'ai-01':['sm'],'gov-03':['cfg'],'gov-01':['art'],'ana-03':['glue'],'iam-cost-01':['iam'],'sec-09':['mp'],'iam-06':['sec'],
'sec-01':['sh'],'sec-02':['waf'],'sec-06':['waf'],'edge-03':['ga'],'net-06':['r53'],'db-01':['rds'],'db-train-01':['rds'],
'oth-01':['sns'],'msg-train-02':['sns'],'oth-08':['ws'],'oth-04':['con'],'oth-03':['eb'],'stg-train-02':['fsx'],'sec-03':['gd'],
'db-04':['aur'],'db-train-02':['aur'],'gov-04':['cw'],'gov-02':['ct'],'oth-06':['cp'],'oth-10':['iot'],'mig-03':['dms'],
'storage-01':['s3'],'storage-02':['s3'],'stg-train-04':['s3'],'stg-train-03':['ebs'],'comp-02':['asg'],'comp-03':['elb'],
'comp-01':['lam','lamp'],'cmp-train-01':['lam','lamp'],'db-03':['ec'],'db-train-03':['ec'],'oth-02':['sqs'],'msg-train-01':['sqs'],
'ana-02':['kds'],'msg-train-03':['kds'],'gov-05':['acm'],'net-05':['vpn']}
M={'clf-q-'+k:v for k,v in M.items()}; done=set()
for f in glob.glob(C+'questions/clf-*.json'):
    d=json.load(open(f)); ch=False
    for q in d:
        if q['id'] in M:
            for k in reversed(M[q['id']]):
                t,u=U[k]
                if all(s['url']!=u for s in q['sources']): q['sources'].insert(0,{"title":t,"url":u})
            q['verifiedAt']=D; done.add(q['id']); ch=True
    if ch: json.dump(d,open(f,'w'),ensure_ascii=False,indent=2); open(f,'a').write('\n')
print(len(done), set(M)-done)
