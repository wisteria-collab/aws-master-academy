from p4common import *
import json,os
D2='2026-11-13'
TH={"title":"Throttle requests to your REST APIs for better throughput in API Gateway（Amazon API Gateway デベロッパーガイド）","url":"https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html"}
TW={"title":"REL05-BP02 Throttle requests（AWS Well-Architected Framework）","url":"https://docs.aws.amazon.com/wellarchitected/2025-02-25/framework/rel_mitigate_interaction_failure_throttle_requests.html"}
OV={"title":"Overview of Amazon Web Services（AWS ホワイトペーパー）","url":"https://docs.aws.amazon.com/pdfs/whitepapers/latest/aws-overview/aws-overview.pdf"}
def A(id,task,stem,right,rexp,wrongs,kw,point,srcs,rel,svs):
    d=SQ(id,task,"advanced",stem,right,rexp,wrongs,kw,point,srcs,rel,svs,"scenario"); d['verifiedAt']=D2; return d
qs=[
 A("saa-q-thr-waf-01","saa-1-2","ある企業は、Amazon API GatewayのAPIに、スロットリングの上限を設定しています。最近、特定のIPアドレスの範囲から、SQLインジェクションを狙ったリクエストが届くようになりました。上限を下げると、正規の利用者のリクエストまで断られてしまいます。正規の利用者への影響を抑えながら、攻撃を狙ったリクエストを遮断したいと考えています。最も適切な方法はどれですか。",
  "AWS WAFを使い、該当するIPアドレスの範囲やSQLインジェクションを狙ったリクエストを遮断するルールを設定する","AWS WAFは、SQLインジェクションなどのウェブアプリケーションへの攻撃から保護するサービスです。リクエストの内容や送信元を条件に、遮断するものを選べます。API Gatewayのスロットリングは、量を抑えてサービスを守るための目標値で、特定の攻撃を遮断する仕組みではありません。",
  [("アカウント全体のスロットリングの上限を、さらに下げる","量を抑えるだけで、攻撃のリクエストと正規のリクエストを区別できません。問題文のとおり、正規の利用者まで断られます。","正規の利用者への影響を抑えながら"),
   ("AWS Shieldだけで対応する","AWS Shieldは、DDoS攻撃から保護するサービスです。SQLインジェクションのような、ウェブアプリケーションへの攻撃の遮断には、AWS WAFを使います。","SQLインジェクションを狙った"),
   ("AWS Budgetsで、APIの費用が予算を超えたら通知を受け取る","Budgetsは、費用や使用量が予算を超えそうなときに通知するサービスです。リクエストを遮断することはできません。","攻撃を狙ったリクエストを遮断したい")],
  ["正規の利用者への影響を抑えながら","SQLインジェクションを狙った","攻撃を狙ったリクエストを遮断したい"],"量を抑える＝スロットリング。攻撃を見分けて遮断する＝AWS WAF。DDoS＝Shield。",[TH,OV,SG],[L("saa-secure-workloads")],["aws-waf","amazon-api-gateway"]),
 A("saa-q-thr-sqs-01","saa-2-1","ある企業は、Amazon API Gatewayで受け付けた注文を、背後のシステムで1件ずつ処理しています。セールの時期には注文が一時的に集中し、背後のシステムが処理しきれなくなります。注文を断ったり失ったりしてはいけませんが、処理は数分遅れてもかまいません。背後のシステムを大きくせずに対応したいと考えています。最も適切な方法はどれですか。",
  "注文をAmazon SQSのキューにためて、背後のシステムが自分のペースで取り出して処理する","Amazon SQSのキューにためると、注文の受け付けと処理を切り離せます。背後のシステムは、自分のペースでキューから取り出して処理します。集中した注文を断らずに受け付け、処理を後にずらすことができます。",
  [("API Gatewayのスロットリングの上限を下げて、集中した分を断る","スロットリングは、上限を超えたリクエストを429エラーで断ります。注文を断ってはいけない、という要件に合いません。","注文を断ったり失ったりしてはいけません"),
   ("背後のシステムを、より大きなインスタンスタイプに変更する","処理能力は上がりますが、問題文は、背後のシステムを大きくしない方法を求めています。","背後のシステムを大きくせずに"),
   ("Amazon SNSのトピックに注文を送り、背後のシステムに一斉に通知する","SNSは、メッセージを購読者に一斉に届けるサービスです。注文をためておいて、受け取る側のペースで処理させる仕組みではありません。","背後のシステムが処理しきれなくなります")],
  ["注文を断ったり失ったりしてはいけません","処理は数分遅れてもかまいません","背後のシステムを大きくせずに"],"断ってよい＝スロットリング。断れないが遅れてよい＝キュー（SQS）にためて、流量をならす。",[TH,TW,OV,SG],[L("saa-scalable-loose"),L("saa-ha-ft")],["amazon-sqs","amazon-api-gateway"]),
]
check_qs(qs); w('questions/saa-p11d.json',qs)
for les,ids in [('saa-secure-workloads',['saa-q-thr-waf-01']),('saa-scalable-loose',['saa-q-thr-sqs-01'])]:
    p=os.path.join(ROOT,'lessons',les+'.json'); d=json.load(open(p))
    for i in ids:
        if i not in d['quizQuestionIds']: d['quizQuestionIds'].append(i)
    json.dump(d,open(p,'w'),ensure_ascii=False,indent=2)
print('ok')
