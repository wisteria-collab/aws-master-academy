import json,glob
C='/home/claude/aws-master-academy/content/'; D='2026-11-15'; G='https://docs.aws.amazon.com/'
U={
'pred':("Predictive scaling for Amazon EC2 Auto Scaling（Amazon EC2 Auto Scaling ユーザーガイド）",G+"autoscaling/ec2/userguide/ec2-auto-scaling-predictive-scaling.html"),
'alb':("What is an Application Load Balancer?（Elastic Load Balancing ユーザーガイド）",G+"elasticloadbalancing/latest/application/introduction.html"),
'nlb':("What is a Network Load Balancer?（Elastic Load Balancing ユーザーガイド）",G+"elasticloadbalancing/latest/network/introduction.html"),
'sub':("Subnets for your VPC（Amazon VPC ユーザーガイド）",G+"vpc/latest/userguide/configure-subnets.html"),
'hdd':("Amazon EBS Throughput Optimized HDD and Cold HDD volumes（Amazon EBS ユーザーガイド）",G+"ebs/latest/userguide/hdd-vols.html"),
'parq':("Convert input data format in Amazon Data Firehose（Amazon Data Firehose デベロッパーガイド）",G+"firehose/latest/dev/record-format-conversion.html"),
'spot':("Spot Instances（Amazon EC2 ユーザーガイド）",G+"AWSEC2/latest/UserGuide/using-spot-instances.html"),
'fgw':("What is Amazon S3 File Gateway?（AWS Storage Gateway ユーザーガイド）",G+"filegateway/latest/files3/what-is-file-s3.html"),
'vgw':("What is Volume Gateway?（AWS Storage Gateway ユーザーガイド）",G+"storagegateway/latest/vgw/WhatIsStorageGateway.html"),
}
M={'saa-q-pc-01':['pred'],'saa-q-lb-train-01':['alb'],'saa-q-lb-train-02':['nlb'],'saa-q-pn-05':['sub'],'saa-q-cs-04':['hdd'],
'saa-q-di-01':['parq'],'saa-q-cc-01':['spot'],'saa-q-ps-03':['fgw','vgw']}
done=set()
for f in glob.glob(C+'questions/saa-*.json'):
    d=json.load(open(f)); ch=False
    for q in d:
        if q['id'] in M:
            for k in reversed(M[q['id']]):
                t,u=U[k]
                if all(s['url']!=u for s in q['sources']): q['sources'].insert(0,{"title":t,"url":u})
            q['verifiedAt']=D; done.add(q['id']); ch=True
    if ch: json.dump(d,open(f,'w'),ensure_ascii=False,indent=2); open(f,'a').write('\n')
print(len(done), set(M)-done)
