import json
R='/home/claude/aws-master-academy/content/comparisons/'; D='2026-11-13'
S={
'ds1':("AWS DataSync quotas（AWS DataSync ユーザーガイド）","https://docs.aws.amazon.com/datasync/latest/userguide/datasync-limits.html"),
'ds2':("Choosing a task mode for your data transfer（AWS DataSync ユーザーガイド）","https://docs.aws.amazon.com/ja_jp/datasync/latest/userguide/choosing-task-mode.html"),
'tf':("What is AWS Transfer Family?（AWS Transfer Family ユーザーガイド）","https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html"),
'sg':("AWS Storage Gateway FAQs（AWS公式）","https://aws.amazon.com/storagegateway/faqs/"),
'ebs':("Amazon EBS volume types（Amazon EBS ユーザーガイド）","https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html"),
'gw':("Gateway Load Balancers（Elastic Load Balancing ユーザーガイド）","https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/gateway-load-balancers.html"),
'kds':("Quotas and limits（Amazon Kinesis Data Streams デベロッパーガイド）","https://docs.aws.amazon.com/ja_jp/streams/latest/dev/service-sizes-and-limits.html"),
'maz':("Amazon RDS Multi-AZ（AWS公式）","https://aws.amazon.com/rds/features/multi-az/"),
'vf':("Amazon VPC FAQs（AWS公式）","https://aws.amazon.com/vpc/faqs/"),
'tgq':("Quotas for your transit gateways（Amazon VPC Transit Gateways）","https://docs.aws.amazon.com/ja_jp/vpc/latest/tgw/transit-gateway-quotas.html"),
}
C={
('data-transfer','AWS DataSync','scalability'):("1回のタスクの実行で扱えるファイルやオブジェクトの数は、ベーシックモードでは上限がある（オンプレミスなどとの転送で最大5,000万、AWSのストレージ同士で最大2,500万）。拡張モードでは、事実上無制限。1つのタスクのスループットは、エージェントありで最大10 Gbps",['ds1','ds2']),
('data-transfer','AWS Transfer Family','availability'):("最大3つのアベイラビリティゾーンに対応し、自動でスケールする冗長な仕組みで、接続と転送のリクエストを処理する",['tf']),
('data-transfer','AWS Transfer Family','scalability'):("必要に応じて、リアルタイムに拡張する。ファイル転送のためのサーバーを、利用者が運用する必要はない",['tf']),
('data-transfer','AWS Storage Gateway','availability'):("VMware vSphereでは、VMware HAと組み合わせて、障害のときにゲートウェイを自動で再起動できる（最大60秒程度の停止）。クラスター構成のvSphere環境が必要",['sg']),
('data-transfer','AWS Storage Gateway','scalability'):("種類ごとに上限がある。ボリュームゲートウェイは1つのゲートウェイで最大32ボリューム（キャッシュ型で最大1 PB、保管型で最大512 TB）。テープゲートウェイは、1つのライブラリで最大1,500本（合計1 PB）。仮想マシンのゲートウェイのローカルキャッシュは最大64 TiB",['sg']),
('ebs-volume-types','プロビジョンドIOPS SSD（io2 Block Express）','limits'):("最大64 TiB、最大256,000 IOPS、最大4,000 MiB/秒。最大のIOPSを出せるのはNitroベースのインスタンス。それ以外のインスタンスでは、64,000 IOPSまでのボリュームを付けられるが、出せるのは最大32,000 IOPS",['ebs']),
('load-balancers','Gateway Load Balancer','performance'):("通信量の変化に合わせて、自動的に拡張する。ターゲットへは、GENEVEというプロトコル（ポート6081）で通信を転送する",['gw']),
('messaging','Amazon Kinesis','operations'):("容量のモードを選ぶ。オンデマンドではシャードが通信量に合わせて自動で増減し、プロビジョンドではシャードの数を自分で決めて変更する。データの保持期間は、24時間から最大365日まで変更できる",['kds']),
('rds-ha','マルチAZ DBクラスター','cost'):("DBインスタンスの時間に応じて課金される（1時間未満は秒単位、作成や変更などのあとは最低10分）。金額は公式の料金ページで確認する",['maz']),
('vpc-connectivity','VPCピアリング','performance'):("ゲートウェイやVPNを使わず、既存のVPCの仕組みを使うため、単一障害点や帯域のボトルネックがない。ピアリングしたVPC間の帯域は、1つのVPC内と同じ",['vf']),
('vpc-connectivity','AWS Transit Gateway','performance'):("VPCのアタッチメントごとに、アベイラビリティゾーンあたり、各方向で最大100 Gbps",['tgq']),
('vpc-endpoints','ゲートウェイエンドポイント','scalability'):("VPCエンドポイントは、水平に拡張でき、高可用性を持つ",['vf']),
}
n=0
for cid in {k[0] for k in C}:
    p=R+cid+'.json'; d=json.load(open(p)); used=set()
    for it in d['items']:
        for (c,label,ax),(v,ss) in C.items():
            if c==cid and it['label']==label:
                assert it['values'][ax].startswith('この教材の出典'),(cid,label,ax); it['values'][ax]=v; n+=1; used|=set(ss)
    for k in used:
        t,u=S[k]
        if all(s['url']!=u for s in d['sources']): d['sources'].append({"title":t,"url":u})
    d['verifiedAt']=D; json.dump(d,open(p,'w'),ensure_ascii=False,indent=2); open(p,'a').write('\n')
print('filled',n)
