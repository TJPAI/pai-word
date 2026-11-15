#!/usr/bin/env python3
"""V202 strictly source-aligned Phase1 manual editorial content, not QA-certified."""
import json,hashlib,collections,pathlib
root=pathlib.Path('/mnt/data')
E=json.load(open(root/'CGMASTER_V198_SC0001_0005_FRESH_KAIKKI_EXACT_RAW_EVIDENCE_20261115.json'))['entries_by_exact_word']
L={r['source_final_row']:r for r in map(json.loads,open(root/'CGMASTER_V198_SC0001_0005_FRESH_SOURCE_IDENTITY_QA_LEDGER_20261115.jsonl'))}
existing=set()
for vers in ['V199_PHASE1_35','V200_PHASE1_NEXT55','V201_PHASE1_NEXT61']:
 f=next(root.glob(f'CGMASTER_{vers}*DRAFT*.json'))
 existing.update(r['source_final_row'] for r in json.load(open(f))['records'])
# source_final_row, exact Kaikki POS, selected native zero-based sense, editorial English example, editorial Chinese translation, usage note.
choices=[
(739,'verb',0,'Please clean up the kitchen after dinner.','晚饭后请把厨房收拾干净。','clean up 在此表示打扫并收拾区域。'),
(740,'verb',4,'Could you straighten up the living room?','你能把客厅整理整齐吗？','straighten up 在此取整理房间义，不是挺直身体。'),
(742,'verb',0,'We need to organize the books by subject.','我们需要按主题整理书籍。','organize 指系统地安排物品或信息。'),
(745,'verb',0,'Let us clear out the storage closet.','我们把储物柜清空吧。','clear out 强调将里面的东西清走。'),
(746,'verb',1,'Please clear off the table before lunch.','午饭前请把桌面清理出来。','clear off 在这里指清走桌面物品。'),
(748,'verb',0,'It is time to get rid of these old boxes.','该把这些旧纸箱处理掉了。','get rid of 意为摆脱、处理掉。'),
(750,'verb',0,'We donate unused coats every winter.','每年冬天我们都会捐赠不用的外套。','donate 表示自愿捐赠。'),
(751,'verb',0,'This center can recycle glass bottles.','这个中心可以回收利用玻璃瓶。','recycle 指将材料处理后再利用。'),
(753,'verb',0,'Arrange the shoes neatly by the door.','把鞋子整齐地摆在门边。','arrange 在此指有序摆放。'),
(754,'verb',0,'We rearranged the furniture yesterday.','昨天我们重新摆放了家具。','rearrange 指改变原有布置。'),
(758,'verb',0,'Do not let the laundry pile up.','别让待洗衣物堆积起来。','pile up 表示逐渐堆成一堆。'),
(762,'verb',0,'Wipe down the counter after cooking.','做饭后把台面擦干净。','wipe down 指擦拭物体的表面。'),
(764,'verb',0,'I vacuum the carpet twice a week.','我每周用吸尘器清洁地毯两次。','vacuum 在此作动词，表示用吸尘器清洁。'),
(765,'verb',0,'Sweep the floor before you mop it.','拖地前先扫地。','sweep 用扫帚等工具清扫表面。'),
(766,'verb',0,'Mop the kitchen floor after sweeping.','扫完后再拖厨房地板。','mop 在此作动词，不能误选拖把名词义。'),
(767,'verb',0,'I make the bed every morning.','我每天早上整理床铺。','make the bed 指铺平床单被褥。'),
(780,'noun',0,'We watch television in the living room.','我们在客厅看电视。','living room 是家庭休闲活动的房间。'),
(785,'noun',0,'The dictionary is on the bookshelf.','词典放在书架上。','bookshelf 是放书的架子。'),
(803,'noun',0,'Put your phone on the nightstand.','把手机放到床头柜上。','nightstand 指放在床头旁的小桌柜。'),
(804,'noun',0,'The remote is on the coffee table.','遥控器在茶几上。','coffee table 是客厅里通常较低的桌子。'),
(805,'noun',0,'There is a lamp on the side table.','边桌上有一盏灯。','side table 指放在大件家具旁的小桌。'),
(809,'noun',0,'Change the bedsheet before the guests arrive.','客人到来前把床单换掉。','bedsheet 指覆盖床垫的床单。'),
(813,'noun',0,'Put the dirty towels in the laundry basket.','把脏毛巾放进洗衣篮。','laundry basket 是装待洗衣物的篮筐。'),
(816,'noun',0,'The vacuum cleaner is in the closet.','吸尘器放在储物柜里。','vacuum cleaner 指吸尘设备。'),
(818,'noun',0,'Sweep the crumbs into the dustpan.','把面包屑扫进簸箕里。','dustpan 通常与扫帚配合使用。'),
(986,'noun',0,'Cleaning the bathroom takes twenty minutes.','清洁浴室需要二十分钟。','cleaning 在此作名词，指清洁的过程。'),
(988,'noun',0,'We scheduled deep cleaning for Saturday.','我们把深度清洁安排在周六。','deep cleaning 指比日常清洁更彻底的打扫。'),
(989,'noun',0,'We do spring cleaning every March.','我们每年三月进行一次大扫除。','spring cleaning 指季节性彻底清洁。'),
(1003,'verb',0,'Wipe down the shelves with a damp cloth.','用湿布擦拭架子表面。','wipe down 是擦拭物体表面。'),
(1010,'verb',0,'Sanitize the table before preparing food.','准备食物前先清洁消毒桌面。','sanitize 在此指清洁并减少微生物。'),
(1011,'verb',0,'Disinfect the doorknob after cleaning it.','清洁门把手后再进行消毒。','disinfect 指使用消毒手段减少或杀灭病原体。'),
(1012,'verb',0,'Rinse the cup with clean water.','用清水冲洗杯子。','rinse 强调用水快速冲洗。'),
(1026,'verb',0,'I need to run errands after work.','我下班后还要外出办几件杂事。','run errands 是外出处理数件小事。'),
(1041,'noun',0,'Use an all-purpose cleaner on this washable surface.','在这块可清洗的表面上使用多用途清洁剂。','all-purpose cleaner 用于多种适用表面，使用前需查看标签。'),
(1042,'noun',0,'Spray the glass cleaner onto a cloth.','把玻璃清洁剂喷到抹布上。','glass cleaner 是用于玻璃表面的清洁剂。'),
(1045,'noun',0,'Wash the plates with dish soap.','用洗碗液洗盘子。','dish soap 特指洗餐具的洗涤剂。'),
(1047,'noun',0,'Add fabric softener only if the care label permits it.','只有洗护标签允许时才添加衣物柔顺剂。','fabric softener 用于使布料更柔软。'),
(1048,'noun',0,'Apply a stain remover before washing the shirt.','洗衬衫前先使用去渍剂。','stain remover 专门帮助去除污渍。'),
(1050,'noun',0,'Keep the disinfectant out of children’s reach.','把消毒剂放在儿童接触不到的地方。','disinfectant 在此作名词，不能误选形容词。'),
(1051,'noun',0,'The recipe calls for a little baking soda.','食谱需要一点小苏打。','baking soda 的化学成分是碳酸氢钠。'),
(1053,'noun',0,'Tie the trash bag before taking it outside.','把垃圾袋扎好再拿出去。','trash bag 是装垃圾的塑料袋。'),
(1054,'noun',0,'Put the empty wrapper in the garbage can.','把空包装扔进垃圾桶。','garbage can 是美式英语常用表达。'),
(1055,'noun',0,'Place the empty bottle in the recycling bin.','把空瓶子放进回收桶。','recycling bin 用于分类存放可回收物。'),
(1061,'noun',0,'Hang the wet sheets on the clothesline.','把湿床单挂在晾衣绳上。','clothesline 指用于晾晒衣服的绳索。'),
(1062,'noun',0,'Place the sweater flat on a drying rack.','把毛衣平放在晾衣架上。','drying rack 是用于晾干衣物的架子。'),
(1064,'noun',0,'Set up the ironing board before ironing.','熨烫前先把熨衣板支好。','ironing board 是熨烫衣物所用的板子。'),
(1065,'noun',0,'Use a lint roller to remove pet hair.','用黏毛滚筒清除宠物毛发。','lint roller 通过粘性表面去除绒毛。'),
(1075,'adj',0,'The carpet is stained near the doorway.','门口附近的地毯有污渍。','stained 在这里作形容词，表示有污渍。'),
(1076,'adj',0,'The mirror looks smudged after cleaning.','清洁后这面镜子看上去仍有擦痕。','smudged 指被擦抹而变得模糊、有污痕。'),
(1077,'adj',0,'The kitchen window is grimy.','厨房窗户积满了污垢。','grimy 指覆盖着污垢。'),
(1078,'adj',0,'The sink drain is clogged.','洗手池排水口堵住了。','clogged 在这里是形容词，表示堵塞。'),
(1079,'adj',0,'The bread became moldy.','面包发霉了。','moldy 表示覆盖霉菌或发霉。'),
]
records=[]
for row,pos,sense_ix,en,zh,note in choices:
 assert row not in existing,('DUPLICATE_PREVIOUS',row)
 r=L[row];raw=[e for e in E.get(r['expression'],[]) if e['pos']==pos]
 assert len(raw)>=1,(row,'MISSING_NATIVE_POS',r['expression'],pos)
 # Native entry source line + sense index are recorded, editor choice subject to independent QA
 e=raw[0];assert sense_ix<len(e['senses'])
 sense=e['senses'][sense_ix];gloss=(sense.get('glosses') or [None])[0];assert gloss
 sounds=list(dict.fromkeys(s['ipa'] for s in e.get('sounds',[]) if isinstance(s.get('ipa'),str) and s['ipa'].startswith('/') and s['ipa'].endswith('/')))
 ipa=sounds[0] if len(sounds)==1 else None
 obj={'source_final_row':row,'record_id':r['record_id'],'scene_id':r['scene_id'],'lexical_entry_id':r['lexical_entry_id'],'global_sense_id':None,
 'question_page':{'english_expression':r['expression'],'cue_zh':r['cue_zh'],'ipa':ipa,'ipa_source_status':'NATIVE_EXACT_PHONEMIC_SINGLE_UNREVIEWED' if ipa else ('NATIVE_MULTIVARIANT_HOLD' if sounds else 'NATIVE_EXACT_PHONEMIC_ABSENT_HOLD'),'ipa_native_all_phonemic_candidates':sounds,'question_complete':False},
 'answer_page':{'meaning_zh':r['meaning_zh'],'gloss_en':gloss,'pos':pos,'examples':[{'example_en':en,'example_zh':zh,'source':'CG_MASTER_NEW_EDITOR_ORIGINAL_NOT_KAIKKI_ATTESTATION','qa_status':'待审'}],'collocations':[],'usage_note':note,'sense_disambiguation':{'note_zh':note,'status':'EDITOR_UNREVIEWED'},'synonyms':[],'antonyms':[],'answer_complete':False},
 'source_evidence':{'archive_sha256':'4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99','kaikki_exact_raw_line':e['raw_source_line'],'kaikki_lemma':e['word'],'kaikki_pos':pos,'sense_index_zero_based':sense_ix,'native_gloss':gloss,'native_attested_examples_count':len(sense.get('examples',[])),'native_ipa_candidates':sounds,'sense_selection':'CG_MASTER_EDITOR_CANDIDATE_NOT_QA_CONFIRMED'},
 'qa_stage_label':'待审','qa_first_review_verdict':None,'qa_reviewed_content_sha256':None,'formal_ready':0,'srs_eligible':False,'release_allowed':False}
 obj['content_sha256']=hashlib.sha256(json.dumps(obj,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
 records.append(obj)
assert len(records)==len(choices)==52 and len({x['record_id'] for x in records})==52
out=root/'CGMASTER_V202_PHASE1_NEXT52_FRESH_KAIKKI_EDITOR_DRAFT_20261115.json'
out.write_text(json.dumps({'version':'V202','status':'EDITOR_DRAFT_QA_PENDING','source_associations_total':1241,'previous_candidates':151,'new_records':len(records),'records':records},ensure_ascii=False,indent=2)+'\n')
sha=hashlib.sha256(out.read_bytes()).hexdigest()
print('V202',len(records),dict(collections.Counter(x['scene_id'] for x in records)),'bytes',out.stat().st_size,'sha256',sha,'ipa',sum(x['question_page']['ipa'] is not None for x in records))