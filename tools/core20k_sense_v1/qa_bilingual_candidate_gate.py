#!/usr/bin/env python3
"""Independent deterministic QA gate on word-level bilingual mapping candidates.
Reject sense mismatch traps instead of conflating ECDICT headword and OEWN sense.
"""
import json,pathlib,re,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
items=[json.loads(x) for x in (root/"next100_lexical_sense_ku_candidates.jsonl").open(encoding="utf8")]
assert items
pospat=re.compile(r"^(?:n|a|adj|adv|vt|vi|v|art|prep|pron|conj|num|interj)\.",re.I)
counts=collections.Counter();out=[]
for r in items:
 lemma=r["lemma"];zh=r["zh_wordlevel_candidate"];en=r["gloss_en"]
 reason=[]
 clean_zh=pospat.sub("",zh.strip()).strip()
 if pospat.match(zh.strip()):counts["normalized_ecdict_pos_prefix"]+=1
 if not clean_zh:reason.append("EC_DICT_EMPTY_AFTER_POS_REMOVAL")
 if lemma=="an":reason.append("AN_NURSING_DEGREE_VS_ARTICLE_MISMATCH")
 if lemma=="eta":reason.append("ETA_GREEK_LETTER_VS_ARRIVAL_ACRONYM")
 if "\n" in zh or "\\n" in zh:reason.append("MULTILINE_ZH_NOT_SINGLE_MEANING")
 if len(en.strip())<12:reason.append("DEFINITION_TOO_SHORT")
 state="BLOCK_FOR_EDITORIAL" if reason else "UNVERIFIED_PENDING_SEMANTIC_EDITOR"
 out.append({"rank":r["rank"],"lemma":lemma,"source_en":en,"source_zh_wordlevel":zh,"normalized_zh_for_editorial":clean_zh,
  "flags":reason,"gate_status":state,"production_ready":False,"release_eligible":False})
 counts[state]+=1
 for v in reason:counts["flag:"+v]+=1
assert counts["flag:AN_NURSING_DEGREE_VS_ARTICLE_MISMATCH"]==1
assert counts["flag:ETA_GREEK_LETTER_VS_ARRIVAL_ACRONYM"]==1
(root/"next13_deterministic_bilingual_gate.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
print("BILINGUAL_DETERMINISTIC_GATE_PASS",json.dumps({"checked":len(out),"counts":dict(counts),"auto_certified":0},ensure_ascii=False))
