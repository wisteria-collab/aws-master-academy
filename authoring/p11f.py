import json
R='/home/claude/aws-master-academy/content/'; D='2026-11-13'
t=json.load(open(R+'diagrams/tpl-data-lake.json'))
m={"nodes":[{k:v for k,v in n.items() if k!='note'} for n in t['diagram']['nodes']],"edges":t['diagram']['edges']}
c={"id":"ch-data-lake","status":"verified","sources":t['sources'],"verifiedAt":D,"basedOnGuide":[{"exam":"saa","version":"1.1"}],"title":"流れ続けるデータを、分析できる湖にためる","order":8,
 "scenario":"ある会社は、工場のセンサーから、データを絶え間なく受け取っています。このデータを1か所にためて、分析の担当者がSQLで調べられるようにしたいと考えています。保存の前に、分析しやすい列指向のフォーマットに変換しておきたいです。また、機密性の高いデータへのアクセスは、まとめて管理したいと考えています。",
 "requirements":["流れ続けるデータを、ストリーミングのサービスで取り込む","取り込んだデータを、変換してからAmazon S3にためる","S3のデータを、SQLで分析できるようにする","データレイクへのアクセスを、まとめて管理する"],
 "hints":["データの届き方が「流れ続ける」ことに注目します。まとまったデータを移すときとは、使うサービスが違います。","S3に届ける前に、Apache ParquetやApache ORCに変換できるサービスがあります。"],
 "modelAnswer":m,
 "modelExplanation":"流れ続けるデータは、Amazon Kinesis Data Streamsで取り込み、Amazon Data FirehoseでS3に届けます。Data Firehoseは、S3に届ける前に、Apache ParquetやApache ORCといった列指向のフォーマットに変換できます。S3にためたデータは、Amazon AthenaでSQLを使って分析し、AWS Glueで変換（ETL）します。AWS Lake Formationは、データをカタログ化し、機密性の高いデータへのアクセスを保護する仕組みを用意します。",
 "relatedTemplateIds":["tpl-data-lake"],
 "checklist":[
  {"id":"c1","label":"ストリーミングの取り込み（Kinesis Data Streams）を使っている","rule":{"type":"hasService","serviceIds":["amazon-kinesis"]},"reason":"流れ続けるデータは、ストリーミングのサービスで取り込みます。"},
  {"id":"c2","label":"Amazon Data Firehoseを使っている","rule":{"type":"hasService","serviceIds":["amazon-data-firehose"]},"reason":"Data Firehoseは、S3に届ける前に、列指向のフォーマットに変換できます。"},
  {"id":"c3","label":"Data FirehoseとS3が、線でつながっている","rule":{"type":"connected","from":["amazon-data-firehose"],"to":["amazon-s3"]},"reason":"変換したデータを、データレイクのS3に届けます。"},
  {"id":"c4","label":"Amazon Athenaを使い、S3とつながっている","rule":{"type":"connected","from":["amazon-athena"],"to":["amazon-s3"]},"reason":"Athenaで、S3のデータをSQLで分析します。"},
  {"id":"c5","label":"AWS Lake Formationを使っている","rule":{"type":"hasService","serviceIds":["aws-lake-formation"]},"reason":"Lake Formationは、データレイクのデータをカタログ化し、機密性の高いデータへのアクセスを保護します。"},
  {"id":"c6","label":"まとまったデータ向けの転送サービス（AWS DataSync）だけで取り込んでいない","rule":{"type":"notService","serviceIds":["aws-datasync"]},"reason":"DataSyncは、まとまったデータを移すときのサービスです。流れ続けるデータには、ストリーミングのサービスを使います。"}]}
json.dump(c,open(R+'challenges/ch-data-lake.json','w'),ensure_ascii=False,indent=2); open(R+'challenges/ch-data-lake.json','a').write('\n'); print('ok')
