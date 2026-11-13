from p4common import *
import json,os
D2='2026-11-13'
GP={"title":"Amazon EBS General Purpose SSD volumes（Amazon EBS ユーザーガイド）","url":"https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html"}
GF={"title":"Amazon EBS General Purpose Volumes（AWS公式）","url":"https://aws.amazon.com/ebs/general-purpose/"}
EV={"title":"Modify an Amazon EBS volume using Elastic Volumes operations（Amazon EBS ユーザーガイド）","url":"https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html"}
TA={"title":"Amazon VPC attachments in AWS Transit Gateway（Amazon VPC Transit Gateways）","url":"https://docs.aws.amazon.com/vpc/latest/tgw/tgw-vpc-attachments.html"}
TW={"title":"How AWS Transit Gateway works（Amazon VPC Transit Gateways）","url":"https://docs.aws.amazon.com/vpc/latest/tgw/how-transit-gateways-work.html"}
DL={"title":"AWS DataSync quotas（AWS DataSync ユーザーガイド）","url":"https://docs.aws.amazon.com/datasync/latest/userguide/datasync-limits.html"}
DM={"title":"Choosing a task mode for your data transfer（AWS DataSync ユーザーガイド）","url":"https://docs.aws.amazon.com/ja_jp/datasync/latest/userguide/choosing-task-mode.html"}
def A(id,task,stem,right,rexp,wrongs,kw,point,srcs,rel,svs):
    d=SQ(id,task,"advanced",stem,right,rexp,wrongs,kw,point,srcs,rel,svs,"scenario"); d['verifiedAt']=D2; return d
qs=[
 A("saa-q-gp3-cost-01","saa-4-1","ある企業は、データベースのサーバーに、汎用SSD（gp2）のAmazon EBSボリュームを使っています。gp2は容量に比例して性能が上がるため、必要なIOPSを得るために、データの量より大きな容量を用意しています。今の性能を保ったまま、ストレージの費用を下げたいと考えています。サーバーは止めたくありません。最も適切な方法はどれですか。",
  "Elastic Volumesでボリュームの種類をgp3に変更し、必要なIOPSとスループットを設定する","gp3は、容量とは別にIOPSとスループットを設定できるため、性能のために余分な容量を用意する必要がありません。容量あたりの料金もgp2より低く設定されています。Elastic Volumesを使えば、EC2インスタンスを止めずに、種類やIOPS、スループットを変更できます。",
  [("ボリュームの種類をプロビジョンドIOPS SSD（io2 Block Express）に変更する","io2 Block Expressは、gp3を超えるIOPSや低い遅延が必要なときの選択肢です。今の性能を保つだけなら、費用を下げる目的に合いません。","ストレージの費用を下げたい"),
   ("インスタンスを停止し、スナップショットからgp2の小さいボリュームを作り直す","gp2は容量に比例して性能が決まるため、容量を小さくすると性能も下がります。また、インスタンスを止める必要があります。","今の性能を保ったまま"),
   ("ボリュームの種類をスループット最適化HDD（st1）に変更する","st1は、大きなデータを順に読み書きする処理向けのHDDです。IOPSが重要なデータベースには向かず、今の性能を保てません。","今の性能を保ったまま")],
  ["今の性能を保ったまま","ストレージの費用を下げたい","サーバーは止めたくありません"],"性能のために容量を大きくしている＝gp3へ。容量と性能を別に設定でき、Elastic Volumesで止めずに変更できる。",[GP,GF,EV,SG],[L("saa-cost-storage"),C("ebs-volume-types")],["amazon-ebs"]),
 A("saa-q-tgw-az-01","saa-2-2","ある企業は、VPCをAWS Transit Gatewayに接続しています。VPCのアタッチメントには、アベイラビリティゾーンAのサブネットを1つだけ指定しました。アベイラビリティゾーンBのサブネットにあるEC2インスタンスから、Transit Gateway経由でほかのVPCに接続できません。ルートテーブルには、Transit Gatewayへの経路が設定されています。接続できるようにし、可用性も高めたいと考えています。どうすればよいですか。",
  "VPCのアタッチメントに、アベイラビリティゾーンBのサブネットを追加する","Transit Gatewayは、アタッチメントに指定したサブネットのあるアベイラビリティゾーンでだけ使えます。アタッチメントがないアベイラビリティゾーンのリソースは、Transit Gatewayに届きません。可用性のためにも、複数のアベイラビリティゾーンを有効にすることが推奨されています。",
  [("アベイラビリティゾーンBのサブネットのネットワークACLで、すべての通信を許可する","問題は、アベイラビリティゾーンBがアタッチメントで有効になっていないことです。ネットワークACLを広げても、Transit Gatewayには届きません。","アベイラビリティゾーンAのサブネットを1つだけ指定しました"),
   ("2つ目のTransit Gatewayを作成して、アベイラビリティゾーンBに置く","Transit Gatewayを増やす必要はありません。既存のアタッチメントで、アベイラビリティゾーンBを有効にすれば届くようになります。","アベイラビリティゾーンAのサブネットを1つだけ指定しました"),
   ("EC2インスタンスを、より大きなインスタンスタイプに変更する","インスタンスの性能の問題ではありません。アタッチメントのないアベイラビリティゾーンからは、Transit Gatewayに届きません。","接続できません")],
  ["アベイラビリティゾーンAのサブネットを1つだけ指定しました","アベイラビリティゾーンBのサブネットにある"],"Transit Gatewayのアタッチメント＝アベイラビリティゾーンごとにサブネットを1つ指定。指定のないゾーンからは届かない。複数ゾーンを有効にする。",[TA,TW,SG],[L("saa-perf-network"),C("vpc-connectivity")],["aws-transit-gateway"]),
 A("saa-q-ds-mode-01","saa-3-5","ある企業は、社内のNFSファイルサーバーにある約3億個の小さなファイルを、Amazon S3に移行します。AWS DataSyncを使う予定です。1回のタスクの実行で、すべてのファイルをまとめて転送したいと考えています。どの設定が適切ですか。",
  "DataSyncのタスクを、拡張モード（Enhanced mode）で作成する","拡張モードは、扱えるオブジェクトの数が事実上無制限で、一覧の作成や転送、確認を並行して行います。ベーシックモードでは、オンプレミスとの転送で、1回の実行あたり最大5,000万のファイルやオブジェクトという上限があります。NFSのファイルサーバーからS3への転送は、拡張モードのエージェントで対応しています。",
  [("DataSyncのタスクを、ベーシックモードで作成する","ベーシックモードでは、オンプレミスとの転送で、1回の実行あたり最大5,000万のファイルやオブジェクトが上限です。約3億個を1回で転送できません。","約3億個の小さなファイル"),
   ("AWS Storage Gatewayのボリュームゲートウェイを使う","ボリュームゲートウェイは、ブロック単位のボリュームを提供する仕組みです。NFSのファイルを、S3のオブジェクトとして移行する目的には合いません。","Amazon S3に移行します"),
   ("Amazon Kinesis Data Streamsでファイルを1つずつ送る","Kinesis Data Streamsは、流れ続けるデータを取り込むサービスです。既存の大量のファイルの移行には、DataSyncのような転送サービスを使います。","社内のNFSファイルサーバーにある")],
  ["約3億個の小さなファイル","1回のタスクの実行で"],"DataSyncのファイル数の上限：ベーシック＝1回5,000万（オンプレミス）、拡張モード＝事実上無制限。",[DL,DM,SG],[L("saa-perf-data"),C("data-transfer")],["aws-datasync"]),
]
check_qs(qs); w('questions/saa-p13a.json',qs)
for les,ids in [('saa-cost-storage',['saa-q-gp3-cost-01']),('saa-perf-network',['saa-q-tgw-az-01']),('saa-perf-data',['saa-q-ds-mode-01'])]:
    p=os.path.join(ROOT,'lessons',les+'.json'); d=json.load(open(p))
    for i in ids:
        if i not in d['quizQuestionIds']: d['quizQuestionIds'].append(i)
    json.dump(d,open(p,'w'),ensure_ascii=False,indent=2)
print('ok')
