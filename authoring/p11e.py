import json,os
R='/home/claude/aws-master-academy/content/'; D='2026-11-13'
GS=[{"exam":"saa","version":"1.1"}]
def tpl(i): return json.load(open(R+f'diagrams/{i}.json'))
def model(t): return {"nodes":[{k:v for k,v in n.items() if k!='note'} for n in t['diagram']['nodes']],"edges":t['diagram']['edges']}
def save(p,d): json.dump(d,open(R+p,'w'),ensure_ascii=False,indent=2); open(R+p,'a').write('\n')
t=tpl('tpl-dr-warm-standby')
save('challenges/ch-dr-warm.json',{"id":"ch-dr-warm","status":"verified","sources":t['sources'],"verifiedAt":D,"basedOnGuide":GS,"title":"リージョンが止まっても、数分で戻す","order":6,
 "scenario":"ある会社の会員サイトは、1つのリージョンで、EC2インスタンスとAmazon Auroraを使って動いています。リージョン全体の障害に備えて、災害対策を用意することになりました。復旧の目標は、失ってよいデータが数秒分、止まってよい時間が数分です。費用を抑えるため、別のリージョンの環境は、本番より小さい規模で常に動かしておきます。",
 "requirements":["本番のリージョンと、災害対策用のリージョンを分ける","災害対策用のリージョンでも、小さい規模のアプリケーションとデータベースを常に動かす","データベースの内容を、別のリージョンへ継続的に複製する","障害のときは、利用者の通信を自動で災害対策用のリージョンへ切り替える"],
 "hints":["リージョンを2つの枠で表し、それぞれの中にEC2とAuroraを置きます。","利用者の通信の切り替えには、ヘルスチェックによる自動のDNSフェイルオーバーに対応するサービスを使います。"],
 "modelAnswer":model(t),
 "modelExplanation":"この目標（データは数秒分、停止は数分）は、ウォームスタンバイの目安に当たります。別のリージョンに縮小版の環境を常に動かし、Auroraグローバルデータベースで、データをリージョンをまたいで継続的に非同期で複製します。障害のときは、Amazon Route 53のヘルスチェックによる自動のDNSフェイルオーバーで、利用者を災害対策用のリージョンへ向け、セカンダリのリージョンを昇格します。",
 "relatedTemplateIds":["tpl-dr-warm-standby"],
 "checklist":[
  {"id":"c1","label":"リージョンの枠が2つある","rule":{"type":"hasGroup","labelIncludes":["リージョン"],"min":2},"reason":"リージョン全体の障害に備えるには、別のリージョンに環境を用意します。"},
  {"id":"c2","label":"Amazon Auroraを2つ使っている","rule":{"type":"hasService","serviceIds":["amazon-aurora"],"min":2},"reason":"それぞれのリージョンにデータベースを置きます。"},
  {"id":"c3","label":"Aurora同士が、線でつながっている","rule":{"type":"connected","from":["amazon-aurora"],"to":["amazon-aurora"]},"reason":"Auroraグローバルデータベースは、リージョンをまたいで継続的に非同期で複製します。"},
  {"id":"c4","label":"アプリケーションのサーバー（EC2）を使っている","rule":{"type":"hasService","serviceIds":["amazon-ec2","amazon-ec2-auto-scaling"],"min":2},"reason":"ウォームスタンバイでは、災害対策用のリージョンでも、縮小版のアプリケーションを常に動かします。"},
  {"id":"c5","label":"Amazon Route 53を使っている","rule":{"type":"hasService","serviceIds":["amazon-route-53"]},"reason":"Route 53は、ヘルスチェックによる自動のDNSフェイルオーバーに対応します。"},
  {"id":"c6","label":"Route 53とアプリケーションのサーバーが、線でつながっている","rule":{"type":"connected","from":["amazon-route-53"],"to":["amazon-ec2","amazon-ec2-auto-scaling"]},"reason":"利用者の通信は、Route 53が、通常は本番へ、障害のときは災害対策用のリージョンへ向けます。"}]})
t=tpl('tpl-hybrid-connect')
save('challenges/ch-hybrid.json',{"id":"ch-hybrid","status":"verified","sources":t['sources'],"verifiedAt":D,"basedOnGuide":GS,"title":"本社と2つのVPCを、ハブでつなぐ","order":7,
 "scenario":"ある会社は、AWS上に、部署ごとに2つのVPCを持っています。本社のデータセンターから、両方のVPCのサーバーに接続する必要があります。毎日、大量のデータを、一貫した品質で送ります。さらに、専用の接続に問題が起きたときのために、既存のインターネット回線を使った暗号化された接続も用意しておきます。今後VPCが増えても、接続の管理が複雑にならないようにしたいと考えています。",
 "requirements":["本社とAWSを、専用の接続で結ぶ","予備として、インターネット回線を使う暗号化された接続も用意する","2つのVPCと本社を、中央のハブで接続する","VPCが増えても、1対1の接続を増やさずに済むようにする"],
 "hints":["本社とVPCは、それぞれ枠で表します。","1対1の接続（VPCピアリング）ではなく、多数のVPCとオンプレミスをまとめて接続できるハブのサービスを使います。"],
 "modelAnswer":model(t),
 "modelExplanation":"大量のデータを一貫した品質で送るには、専用のネットワーク接続のAWS Direct Connectを使います。予備には、既存のインターネット回線で暗号化されたトンネルを張るAWS Site-to-Site VPNを用意します。両方をAWS Transit Gatewayにつなぎ、Transit Gatewayから各VPCへ接続します。VPCピアリングは1対1の接続で、推移的なルーティングに対応しないため、VPCが増えると接続の管理が複雑になります。",
 "relatedTemplateIds":["tpl-hybrid-connect"],
 "checklist":[
  {"id":"c1","label":"VPCの枠が2つある","rule":{"type":"hasGroup","labelIncludes":["VPC"],"min":2},"reason":"部署ごとの2つのVPCを表します。"},
  {"id":"c2","label":"AWS Direct Connectを使っている","rule":{"type":"hasService","serviceIds":["aws-direct-connect"]},"reason":"大量のデータを継続的に、一貫した品質で送るための専用の接続です。"},
  {"id":"c3","label":"Site-to-Site VPNを使っている","rule":{"type":"hasService","serviceIds":["aws-vpn"]},"reason":"既存のインターネット回線を使う、暗号化された予備の接続です。"},
  {"id":"c4","label":"AWS Transit Gatewayを使っている","rule":{"type":"hasService","serviceIds":["aws-transit-gateway"]},"reason":"多数のVPCとオンプレミスのネットワークを、中央のハブで接続します。"},
  {"id":"c5","label":"Direct ConnectとTransit Gatewayが、線でつながっている","rule":{"type":"connected","from":["aws-direct-connect"],"to":["aws-transit-gateway"]},"reason":"本社からの専用の接続を、ハブに集めます。"},
  {"id":"c6","label":"VPNとTransit Gatewayが、線でつながっている","rule":{"type":"connected","from":["aws-vpn"],"to":["aws-transit-gateway"]},"reason":"予備の接続も、同じハブに集めます。"},
  {"id":"c7","label":"Transit GatewayとEC2が、線でつながっている","rule":{"type":"connected","from":["aws-transit-gateway"],"to":["amazon-ec2"]},"reason":"ハブから、各VPCのサーバーへ接続します。"},
  {"id":"c8","label":"EC2がVPCの枠の中にある","rule":{"type":"insideGroup","serviceIds":["amazon-ec2"],"labelIncludes":["VPC"]},"reason":"サーバーは、それぞれのVPCの中に置きます。"}]})
print('ok')
