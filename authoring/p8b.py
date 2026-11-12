from p4common import *
D2='2026-11-12'
def load(p): return json.load(open(os.path.join(ROOT,p)))
def save(p,d): json.dump(d,open(os.path.join(ROOT,p),'w'),ensure_ascii=False,indent=2)
def addsrc(d,srcs):
    urls={s['url'] for s in d['sources']}
    d['sources']+=[s for s in srcs if s['url'] not in urls]; d['verifiedAt']=D2
V=json.load(open('/home/claude/authoring/p8-verified.json'))
for sid,(url,note) in V.items():
    d=load(f'services/{sid}.json'); d['pricingUrl']=url; d['pricingNote']=note; d['volatile']=True
    addsrc(d,[{"title":f"{d['name']} の料金（AWS公式）","url":url}]); save(f'services/{sid}.json',d)
print('services',len(V))
P=lambda sid: {"title":f"{load(f'services/{sid}.json')['name']} の料金（AWS公式）","url":V[sid][0]}
def fill(gid,cells,srcs):
    g=load(f'comparisons/{gid}.json'); n=0
    for it in g['items']:
        for k,v in cells.get(it['key'],{}).items():
            assert k in it['values'],(gid,it['key'],k)
            if it['values'][k]!=v: it['values'][k]=v; n+=1
    addsrc(g,srcs); save(f'comparisons/{gid}.json',g); print(gid,n)
C="。金額は公式の料金ページで確認する"
fill('load-balancers',{k:{'cost':f'ロードバランサーを動かした時間（1時間単位）と、処理の量を表す単位（{u}）の使用量に応じて課金される'+C} for k,u in [('alb','LCU'),('nlb','NLCU'),('gwlb','GLCU')]},[P('elastic-load-balancing')])
fill('messaging',{'sqs':{'cost':'APIリクエストの数に応じて課金される（標準キューとFIFOキューで料金が異なる）'+C},'eventbridge':{'cost':'取り込んだイベントの数や、配信の数などに応じて課金される'+C}},[P('amazon-sqs'),P('amazon-eventbridge')])
fill('compute',{'eks':{'cost':'クラスターを動かした時間に料金がかかる。そのほかに、ノードとして使うEC2インスタンスなどの料金がかかる'+C}},[P('amazon-eks')])
fill('vpc-connectivity',{'tgw':{'cost':'接続（アタッチメント）の数に応じた時間単位の料金と、通過するデータの量に応じたデータ処理の料金がかかる'+C},
 'privatelink':{'cost':'エンドポイントをアベイラビリティゾーンごとに用意している時間と、処理されたデータの量に応じて課金される'+C}},[P('aws-transit-gateway'),P('aws-privatelink')])
fill('vpc-endpoints',{'interface':{'cost':'エンドポイントをアベイラビリティゾーンごとに用意している時間と、処理されたデータの量（GBあたり）に応じて課金される'+C},
 'nat':{'cost':'NATゲートウェイを動かした時間と、処理したデータの量に応じて課金される。標準のデータ転送の料金も加わる'+C}},[P('aws-privatelink'),P('amazon-vpc')])
fill('data-transfer',{'datasync':{'cost':'転送したデータの量に応じて課金される。転送先のS3などには、それぞれの料金がかかる'+C},
 'transfer':{'cost':'エンドポイントで有効にしたプロトコルごとの時間単位の料金と、転送したデータの量に応じて課金される'+C},
 'snow':{'cost':'機器を使った日数（含まれる日数を超えた分）、サービスの料金、配送料などがかかる'+C}},[P('aws-datasync'),P('aws-transfer-family'),P('aws-snow-family')])
