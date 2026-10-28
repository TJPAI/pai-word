#!/usr/bin/env python3
"""Human-readable AI editorial pilot grounded in exact OEWN sense records, 17 words.
Does not assert external independent signoff or production readiness.
"""
import json,pathlib,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
source=[json.loads(l) for l in (root/"oewn_english_sense_production_candidates.jsonl").open(encoding="utf8")]
targets={
"january":("一月","月份名称；January"),
"february":("二月","月份名称；February"),
"april":("四月","月份名称；April"),
"june":("六月","月份名称；June"),
"september":("九月","月份名称；September"),
"october":("十月","月份名称；October"),
"november":("十一月","月份名称；November"),
"december":("十二月","月份名称；December"),
"monday":("星期一","一周中的星期一"),
"sunday":("星期日","一周中的星期日"),
"digitization":("数字化","将模拟信息转换为数字信息的过程"),
"questioner":("提问者","提出问题的人"),
"discussant":("讨论参与者","正式讨论中的参与者"),
"roomful":("一屋子的人或物","一个房间所能容纳的数量"),
"humanize":("使更人性化","使某事物更加人道或富有人情味"),
"experienced":("有经验的","通过实践形成经验或技能的"),
"informer":("告密者","向警方或当局提供秘密信息的人")
}
rows=[];unmatched=[]
for r in source:
 lemma=r["lemma"].casefold()
 if lemma not in targets:continue
 if len(r["candidate_senses"])!=1:
  unmatched.append({"lemma":lemma,"reason":"NON_UNIQUE_OEWN_SENSE"});continue
 ss=r["candidate_senses"][0];zh,note=targets[lemma]
 rows.append({"rank":r["rank"],"lemma":lemma,"headword_id":f"core20k:rank:{r['rank']}",
  "oewn_sense_id":ss["external_sense_id"],"gloss_en":ss["gloss_en"],
  "gloss_zh_editorial":zh,"explanation_zh":note,
  "editorial_status":"AI_EDITORIAL_DRAFT_EN_ZH_SEMANTIC_MATCH",
  "evidence":"OEWN2025 exact English sense, ECDICT word-level Chinese and AI semantic judgment",
  "canonical_sense_id":None,"release_eligible":False,"independent_signoff":False})
assert len(rows)>=14,(len(rows),unmatched)
(root/"bilingual_editorial_pilot.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in rows),encoding="utf8")
print("BILINGUAL_EDITORIAL_PILOT_PASS",json.dumps({"prepared":len(rows),"unmatched":unmatched,"certified":0},ensure_ascii=False))
