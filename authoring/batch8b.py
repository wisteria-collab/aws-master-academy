import json, os, re
src=open('batch1.py').read()
exec(src[:src.index('# ---------------- 用語')])
i=src.index('def svc'); m=re.search(r'\n(?=\S)', src[i:]); exec(src[i:i+m.start()+1])
s=svc("amazon-workspaces-secure-browser","Amazon WorkSpaces Secure Browser",["WorkSpaces Secure Browser","Amazon WorkSpaces Web","WorkSpaces Web"],"end-user-computing",
 "社内のウェブサイトやSaaSアプリケーションへの安全なアクセスを、既存のウェブブラウザから行えるようにするフルマネージドのサービス。",
 "会社の中のサイトを見るための「安全な専用の窓」です。いつものブラウザからその窓を開くと、社内のサイトやウェブアプリを安全に使えます。",
 "社員が、いつも使っているウェブブラウザから、社内のウェブサイトやウェブアプリケーションに安全にアクセスできるようにするサービスです。特別な機器や専用のソフトウェアを用意する必要がありません。",
 "社内のウェブサイトやSaaSアプリケーションへの安全なアクセスを、既存のウェブブラウザから行えるようにするために作られた、低コストでフルマネージドのワークスペースです。アプライアンスや専用のクライアントソフトウェアを管理する負担がありません。",
 ["ブラウザからの、社内サイトやSaaSアプリケーションへの安全なアクセス＝Amazon WorkSpaces Secure Browser。",
  "デスクトップ全体を提供するのはAmazon WorkSpaces、アプリケーションをストリーミングするのはAmazon AppStream 2.0。",
  "試験ガイドでは、エンドユーザーコンピューティングのサービスとして挙げられている。"],
 ["社員が、社内のウェブサイトやSaaSアプリケーションに安全にアクセスする"],
 "利用者は、既存のウェブブラウザから、社内のウェブサイトやSaaSアプリケーションにアクセスします。",
 ["専用の機器やクライアントソフトウェアが不要","フルマネージド"],["対象はウェブサイトやウェブアプリケーション。デスクトップ全体が必要な場合はAmazon WorkSpacesを使う"],
 ["委託先の担当者に、社内のウェブシステムだけを安全に使ってもらう"],
 ["amazon-workspaces","amazon-appstream-2"],["amazon-workspaces","amazon-appstream-2"],[],{"clf":"low","saa":"low"},[{"exam":"clf","domainId":"clf-d3"}],"https://docs.aws.amazon.com/workspaces-web/",[WP,GD3])
s['uncertainNote']='試験ガイド（バージョン1.3）ではAmazon WorkSpaces Secure Browser、AWSのホワイトペーパーではAmazon WorkSpaces Webという名前が使われています。説明はホワイトペーパーのAmazon WorkSpaces Webの記述に基づいています。'
w(f"services/{s['id']}.json",s)
p=os.path.join(ROOT,'lessons/clf-other-services.json'); d=json.load(open(p))
if s['id'] not in d['relatedServiceIds']: d['relatedServiceIds'].insert(10,s['id'])
json.dump(d,open(p,'w'),ensure_ascii=False,indent=2)
