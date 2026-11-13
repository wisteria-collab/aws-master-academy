import json,glob
R='/home/claude/aws-master-academy/content/questions/'; D='2026-11-13'
U={
'asg':("What is Amazon EC2 Auto Scaling?（Amazon EC2 Auto Scaling ユーザーガイド）","https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html"),
'elb':("What is Elastic Load Balancing?（Elastic Load Balancing ユーザーガイド）","https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html"),
'sqs':("What is Amazon Simple Queue Service?（Amazon SQS デベロッパーガイド）","https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html"),
'sgw':("What is AWS Storage Gateway?（AWS Storage Gateway ユーザーガイド）","https://docs.aws.amazon.com/storagegateway/latest/userguide/WhatIsStorageGateway.html"),
'rs':("What is Amazon Redshift?（Amazon Redshift 管理ガイド）","https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html"),
'ct':("What is AWS Control Tower?（AWS Control Tower ユーザーガイド）","https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html"),
'cog':("What is Amazon Cognito?（Amazon Cognito デベロッパーガイド）","https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html"),
'acm':("What is AWS Certificate Manager?（AWS Certificate Manager ユーザーガイド）","https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html"),
'bk':("What is AWS Backup?（AWS Backup デベロッパーガイド）","https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html"),
'sf':("What is Step Functions?（AWS Step Functions デベロッパーガイド）","https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html"),
'apig':("What is Amazon API Gateway?（Amazon API Gateway デベロッパーガイド）","https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html"),
'efs':("What is Amazon Elastic File System?（Amazon EFS ユーザーガイド）","https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html"),
'bat':("What is AWS Batch?（AWS Batch ユーザーガイド）","https://docs.aws.amazon.com/batch/latest/userguide/what-is-batch.html"),
'emr':("What is Amazon EMR?（Amazon EMR 管理ガイド）","https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-what-is-emr.html"),
'cf':("What is Amazon CloudFront?（Amazon CloudFront デベロッパーガイド）","https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html"),
'fh':("What is Amazon Data Firehose?（Amazon Data Firehose デベロッパーガイド）","https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html"),
'lf':("What is AWS Lake Formation?（AWS Lake Formation デベロッパーガイド）","https://docs.aws.amazon.com/lake-formation/latest/dg/what-is-lake-formation.html"),
'kds':("What is Amazon Kinesis Data Streams?（Amazon Kinesis Data Streams デベロッパーガイド）","https://docs.aws.amazon.com/streams/latest/dev/introduction.html"),
'os':("What is Amazon OpenSearch Service?（Amazon OpenSearch Service デベロッパーガイド）","https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html"),
'ds':("What is AWS DataSync?（AWS DataSync ユーザーガイド）","https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html"),
's3':("What is Amazon S3?（Amazon S3 ユーザーガイド）","https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html"),
'ec2':("What is Amazon EC2?（Amazon EC2 ユーザーガイド）","https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html"),
'sp':("What are Savings Plans?（Savings Plans ユーザーガイド）","https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html"),
'lam':("What is AWS Lambda?（AWS Lambda デベロッパーガイド）","https://docs.aws.amazon.com/lambda/latest/dg/welcome.html"),
'ec':("What is Amazon ElastiCache?（Amazon ElastiCache ユーザーガイド）","https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/WhatIs.html"),
'vpn':("What is AWS Site-to-Site VPN?（AWS Site-to-Site VPN ユーザーガイド）","https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html"),
}
M={'saa-q-sc-05':['apig','lam'],'saa-q-pn-02':['cf'],'saa-q-wl-03':['cog'],'saa-q-di-01':['fh'],'saa-q-cc-01':['ec2'],
'saa-q-sc-02':['asg','elb'],'saa-q-cc-05':['asg'],'saa-q-ps-01':['efs'],'saa-q-cd-03':['ec'],'saa-q-pc-03':['emr'],
'saa-q-di-03':['kds'],'saa-q-di-05':['os'],'saa-q-pd-03':['rs'],'saa-q-cd-05':['rs'],'saa-q-cs-02':['s3'],
'saa-q-sc-01':['sqs'],'saa-q-pc-04':['sqs'],'saa-q-data-03':['bk'],'saa-q-pc-02':['bat'],'saa-q-data-02':['acm'],
'saa-q-acc-04':['ct'],'saa-q-dt-train-01':['ds'],'saa-q-di-02':['lf'],'saa-q-cc-04':['lam'],'saa-q-cc-02':['sp'],
'saa-q-sc-04':['sf'],'saa-q-ps-03':['sgw'],'saa-q-dt-train-02':['sgw'],'saa-q-cn-06':['vpn'],'saa-q-ha-03':['elb']}
done=set()
for f in glob.glob(R+'saa-*.json'):
    d=json.load(open(f)); ch=False
    for q in d:
        if q['id'] in M:
            for k in M[q['id']]:
                t,u=U[k]
                if all(s['url']!=u for s in q['sources']): q['sources'].insert(0,{"title":t,"url":u}); ch=True
            q['verifiedAt']=D; done.add(q['id'])
    if ch: json.dump(d,open(f,'w'),ensure_ascii=False,indent=2); open(f,'a').write('\n')
print(len(done), set(M)-done)
