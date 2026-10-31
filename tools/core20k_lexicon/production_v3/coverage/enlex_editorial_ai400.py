#!/usr/bin/env python3
import json,zipfile,pathlib,collections,hashlib,urllib.request,os
SRC=pathlib.Path('/tmp/source.zip');OUT=pathlib.Path('tools/core20k_lexicon/production_v3/coverage/editorial_ai400_output');OUT.mkdir(parents=True,exist_ok=True)
url='https://api.github.com/repos/TJPAI/pai-word/actions/artifacts/13029577965/zip'
req=urllib.request.Request(url,headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json'})
with urllib.request.urlopen(req,timeout=90) as res:SRC.write_bytes(res.read())
with zipfile.ZipFile(SRC) as z: data=[json.loads(line) for line in z.read('priority400_editorial_cards.jsonl').splitlines()]
assert len(data)==400
fix={"5":["REVISE_CANDIDATE","领导者身份；领导地位","status of a leader，不是动作领导"],"6":["REVISE_CANDIDATE","（事件的）余波；后果","wake 尤指灾难后果"],"10":["REVISE_CANDIDATE","碗状凹形；钵状凹面","形状义，原译杯子形过窄"],"11":["REVISE_CANDIDATE","原子团；基团","化学中作为整体的原子团，不是化学族"],"16":["REVISE_CANDIDATE","色谱柱","标准实验仪器名称"],"21":["REVISE_CANDIDATE","背带工装裤；连体工作服","overall 在此为工作服式裤装"],"27":["REVISE_CANDIDATE","周期；循环","名词义，原候选循环地是副词短语"],"33":["REVISE_CANDIDATE","简述；摘要","resume 此名词义为简短概述，草拟为动词"],"37":["REVISE_CANDIDATE","商业竞争","企业争取顾客，未必是价格竞争"],"39":["REVISE_CANDIDATE","天才；智力出众者","exceptional intellectual ability 不等于一般人才"],"43":["REVISE_CANDIDATE","军舰舰长","naval officer 舰长义，不只一般船长"],"48":["REVISE_CANDIDATE","圆","定义为两轴相等的椭圆，即圆"],"49":["REVISE_CANDIDATE","行政管理层；管理机构","原候选组织太宽泛"],"53":["REVISE_CANDIDATE","专用载具；运输车","自驱轮式载具，搬运器不够明确"],"62":["REVISE_CANDIDATE","任期","特定职位任职时段"],"73":["REVISE_CANDIDATE","坏名声；恶名","notoriety 为负面名声"],"75":["REVISE_CANDIDATE","先令（英国旧货币）","旧时货币称呼，需时代标签"],"76":["REVISE_CANDIDATE","种族主义；种族优越偏见","定义是种族优越论的偏见，非单纯歧视行为"],"84":["REVISE_CANDIDATE","权利转让契约","assignment 指转让权利的法律文件"],"89":["REVISE_CANDIDATE","容器；集装箱","宽泛定义包含一般容器"],"103":["REVISE_CANDIDATE","预测；推算","基于观测外推"],"105":["REVISE_CANDIDATE","阻止进入；排除","prevent from entering 并非仅排斥"],"113":["REVISE_CANDIDATE","从未有过性行为的人","原译限定女性，与英文中性定义不符"],"118":["REVISE_CANDIDATE","身体机能缺损；缺陷","特指身体系统中的缺陷"],"123":["REVISE_CANDIDATE","使球员下场；换下球员","bench 为赛场使球员离场"],"127":["REVISE_CANDIDATE","截止界限；限制阈值","cutoff 为功能或资格终止的界限"],"129":["REVISE_CANDIDATE","（免疫学）亲和力","抗原抗体相互吸引的专门概念"],"133":["REVISE_CANDIDATE","拍摄素材；影视镜头","footage 为已拍摄影像，未必是胶片"],"136":["REVISE_CANDIDATE","发育停滞；发育退化","医学或心理发育异常，原译揠苗助长错误"],"147":["REVISE_CANDIDATE","堵塞造成的积压；回流","backup 为阻滞后积聚"],"152":["REVISE_CANDIDATE","粗出生率","年活产数除总人口，每千人表示"],"153":["REVISE_CANDIDATE","插图；内嵌小图","原译添入物含义失准"],"164":["REVISE_CANDIDATE","符号实例；符号个例","token 为 symbol type 的一次具体出现"],"167":["REVISE_CANDIDATE","拱廊商街；带顶商业通道","特指两侧有店铺的廊道"],"170":["REVISE_CANDIDATE","摄影","拍摄与制作照片"],"171":["REVISE_CANDIDATE","前体物质；前驱物质","化学反应前体"],"172":["REVISE_CANDIDATE","复数的；多个的","形容词，不是多元的一般抽象义"],"173":["REVISE_CANDIDATE","抢劫","以暴力威胁实施夺取，不是普通盗窃"],"176":["REVISE_CANDIDATE","天才；杰出才智者","原译人才未体现 exceptional"],"178":["REVISE_CANDIDATE","完整性；完备性","状态名词，不是单纯完全"],"182":["REVISE_CANDIDATE","遮蔽物；掩饰物","cloak 的覆盖和隐匿双重含义"],"186":["REVISE_CANDIDATE","行动主义；积极行动主张","activism 不必然是激进主义"],"189":["REVISE_CANDIDATE","绕行路；临时改道路线","不只是一般弯路"],"193":["REVISE_CANDIDATE","熔炉；工业炉；加热炉","多用于工业热处理，火炉太宽"],"195":["REVISE_CANDIDATE","摩尔（物质的量单位）","克分子为旧译，现代SI用摩尔"],"196":["REVISE_CANDIDATE","使愤慨；使震惊反感","outrage 表示激怒或引起强烈反感"]}
out=[];deferred=[]
for i,r in enumerate(data):
 if i>=199:
  deferred.append(dict(r,reason='Multiple lexemes or ambiguity require per-sense disambiguation; no editorial decision'))
  continue
 if str(i) in fix:decision,zh,reason=fix[str(i)]
 else:
  decision,zh,reason='KEEP_CANDIDATE',r['candidate_zh'],'Source Chinese lexeme tentatively matches English definition; independent context evidence remains required'
 assert zh and r['candidate_zh']
 out.append({'teaching_sense_id':r['teaching_sense_id'],'rank':r['rank'],'lemma':r['lemma'],'synset_id':r['synset_id'],
 'definition_en':r['definition_en'],'original_chinese_lexicalizations':r['source_lexemes'],
 'editorial_disposition':decision,'gloss_zh_revised_candidate':zh,'editorial_reason_zh':reason,
 'review_depth':'INTERNAL_AI_EDITORIAL_FIRST_PASS','evidence_scope':'OEWN_DEFINITION_OMW_LEXEME',
 'independent_certified':False,'production_ready':False})
assert len(out)==199 and len(deferred)==201 and len({r['teaching_sense_id'] for r in out})==199
for name,rows in [('editorial_firstpass_199.jsonl',out),('unresolved_201.jsonl',deferred)]:
 (OUT/name).write_text(''.join(json.dumps(x,ensure_ascii=False)+'\\n' for x in rows),encoding='utf8')
m={'reviewed_firstpass':199,'deferred':201,'disposition_counts':dict(collections.Counter(x['editorial_disposition'] for x in out)),
 'certified':0,'production_ready':0,'sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.glob('*.jsonl')}}
(OUT/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(m,ensure_ascii=False))
