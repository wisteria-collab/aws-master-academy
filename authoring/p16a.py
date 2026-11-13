import json,glob
C='/home/claude/aws-master-academy/content/'; D='2026-11-13'; G='https://docs.aws.amazon.com/'
U={
'lex':("What is Amazon Lex V2?（Amazon Lex V2 デベロッパーガイド）",G+"lexv2/latest/dg/what-is.html"),
'mac':("What is Amazon Macie?（Amazon Macie ユーザーガイド）",G+"macie/latest/user/what-is-macie.html"),
'ses':("What is Amazon SES?（Amazon SES デベロッパーガイド）",G+"ses/latest/dg/Welcome.html"),
'dx':("What is Direct Connect?（AWS Direct Connect ユーザーガイド）",G+"directconnect/latest/UserGuide/Welcome.html"),
'eb':("What is AWS Elastic Beanstalk?（AWS Elastic Beanstalk デベロッパーガイド）",G+"elasticbeanstalk/latest/dg/Welcome.html"),
'kms':("AWS Key Management Service（AWS KMS デベロッパーガイド）",G+"kms/latest/developerguide/overview.html"),
'sh':("Introduction to AWS Security Hub CSPM（AWS Security Hub ユーザーガイド）",G+"securityhub/latest/userguide/what-is-securityhub.html"),
'ta':("AWS Trusted Advisor（AWS Support ユーザーガイド）",G+"awssupport/latest/user/trusted-advisor.html"),
'cvpn':("What is AWS Client VPN?（AWS Client VPN 管理者ガイド）",G+"vpn/latest/clientvpn-admin/what-is.html"),
'xr':("AWS X-Ray（Introduction to DevOps on AWS・AWSホワイトペーパー）",G+"whitepapers/latest/introduction-devops-aws/aws-x-ray.html"),
'org':("Billing and pricing（AWS Organizations ユーザーガイド）",G+"organizations/latest/userguide/pricing.html"),
'maz':("Multi-AZ deployments（Amazon RDS ユーザーガイド）",G+"AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html"),
'arep':("Replication with Amazon Aurora（Amazon Aurora ユーザーガイド）",G+"AmazonRDS/latest/AuroraUserGuide/Aurora.Replication.html"),
's3d':("Data protection / durability（Amazon S3 ユーザーガイド）",G+"AmazonS3/latest/userguide/DataDurability.html"),
'dms':("Migrate an on-premises Oracle database to Amazon RDS for Oracle（AWS規範ガイダンス）",G+"prescriptive-guidance/latest/patterns/migrate-an-on-premises-oracle-database-to-amazon-rds-for-oracle.html"),
'fms':("AWS Firewall Manager（AWS WAF デベロッパーガイド）",G+"waf/latest/developerguide/fms-chapter.html"),
}
M={'clf-q-ai-02':['lex'],'clf-q-sec-05':['mac'],'clf-q-oth-05':['ses'],'clf-q-net-04':['dx'],'clf-q-comp-07':['eb'],'clf-q-gov-06':['kms'],
'clf-q-sec-08':['sh'],'clf-q-sec-07':['ta'],'clf-q-net-07':['cvpn'],'clf-q-oth-07':['xr'],'clf-q-org-cost-01':['org'],'clf-q-db-07':['maz'],
'clf-q-db-train-02':['arep'],'clf-q-stg-train-04':['s3d'],'clf-q-mig-03':['dms'],'clf-q-sec-06':['fms']}
done=set()
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
