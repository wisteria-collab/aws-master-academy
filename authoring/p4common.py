# Phase 4 共通ヘルパー（SAA向け）
import json, os, re
_src=open(os.path.join(os.path.dirname(__file__),'batch1.py')).read()
exec(_src[:_src.index('# ---------------- 用語')])
for _n in ['def svc','def q(','def lesson(']:
    _i=_src.index(_n); _m=re.search(r'\n(?=\S)', _src[_i:]); exec(_src[_i:_i+_m.start()+1])
L=lambda id:{"type":"lesson","id":id}; S=lambda id:{"type":"service","id":id}; C=lambda id:{"type":"comparison","id":id}
GS=[{"exam":"saa","version":"1.1"}]
SG={"title":"SAA-C03 試験ガイド（AWS公式）","url":"https://docs.aws.amazon.com/pdfs/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.pdf"}
NOSRC="この教材の出典には記載がないため、公式ドキュメントで確認する"
AX=['role','mechanism','data','useCases','availability','performance','scalability','cost','operations','limits','chooseWhen','avoidWhen']
def smeta(id,sources): return {"id":id,"status":"verified","sources":sources,"verifiedAt":D,"basedOnGuide":GS}
def add_terms(terms):
    old=json.load(open(os.path.join(ROOT,'glossary/terms.json')))
    new=[{**smeta(i,s_),"term":t,"description":d,"plain":pl,"example":ex,"serviceIds":[]} for i,t,d,pl,ex,s_ in terms]
    ids={t['id'] for t in new}
    w('glossary/terms.json',[t for t in old if t['id'] not in ids]+new)
def ssvc(dom,id,name,aliases,cat,summary,analogy,bdesc,edesc,points,uses,mech,pros,cons,scene,similar,related,imp,doc,srcs):
    d=svc(id,name,aliases,cat,summary,analogy,bdesc,edesc,points,uses,mech,pros,cons,[scene],similar,related,[],imp,[{"exam":"saa","domainId":dom}],doc,srcs)
    d['basedOnGuide']=GS; return d
def SQ(id,task,diff,stem,right,rexp,wrongs,kw,point,srcs,related,svs=[],fmt="scenario",group=None):
    ch=[(right,True,rexp,None)]+[(t,False,e,el) for t,e,el in wrongs]
    d=q(id,"saa-d"+task[4],task,fmt,"single",diff,stem,ch,kw,point,srcs,svs,related,None,group)
    d['exam']='saa'; d['basedOnGuide']=GS; return d
def item(key,label,sid,one,vals):
    assert len(vals)==12,key
    d={"key":key,"label":label,"oneLine":one,"values":dict(zip(AX,vals))}
    if sid: d["serviceId"]=sid
    return d
def flow(*nodes):
    return [({"id":n[0],"question":n[1],"yes":n[2],"no":n[3]} if len(n)==4 else {"id":n[0],"resultItemKey":n[1],"note":n[2]}) for n in nodes]
def slesson(*a):
    d=lesson(*a); d['course']='saa'; d['basedOnGuide']=GS; return d
def check_qs(qs):
    for x in qs:
        for c in x['choices']:
            if not c['correct']: assert c['eliminatedBy'] in x['stem'], (x['id'], c['eliminatedBy'])
            assert len(c['explanation'])>=20,(x['id'],c['text'])
        for k in x['keywords']: assert k in x['stem'], (x['id'], k)
        assert len({c['text'] for c in x['choices']})==4,x['id']
def write_groups(groups):
    for g in groups:
        keys={i['key'] for i in g['items']}
        for n in g['decisionFlow']:
            if 'resultItemKey' in n: assert n['resultItemKey'] in keys
        w(f"comparisons/{g['id']}.json",g)
        for it in g['items']:
            if 'serviceId' not in it: continue
            p=os.path.join(ROOT,'services',it['serviceId']+'.json'); d=json.load(open(p))
            if g['id'] not in d['comparisonGroupIds']: d['comparisonGroupIds'].append(g['id'])
            json.dump(d,open(p,'w'),ensure_ascii=False,indent=2)
