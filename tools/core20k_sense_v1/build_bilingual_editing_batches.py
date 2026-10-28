#!/usr/bin/env python3
"""Construct bilingual pedagogical editing records from 15 OEWN draft batches.
Word-level ECDICT gloss remains an unverified answer candidate until sense-specific review.
"""
import pathlib,json,re,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v21-missing-batch500-all")
idx=json.loads((root/"index.json").read_text())
pat=re.compile(r"^(?:(?:adj|adv|art|aux|conj|interj|n|num|prep|pron|v|vi|vt|a)\.)\s*",re.I)
stats=collections.Counter();allids=set()
for x in idx["batches"]:
 d=root/("batch%03d"%x["batch"])
 rows=[json.loads(y) for y in (d/"english_learning_drafts.jsonl").open(encoding="utf8")]
 edited=[]
 for r in rows:
  src=(r["unverified_chinese_reference"] or "").strip()
  normalized=pat.sub("",src).strip()
  flags=[]
  if not normalized:flags.append("MISSING_ZH")
  if re.search(r"[\n;；/\\]",normalized):flags.append("MULTIPLE_ZH_GLOSS")
  if re.search(r"\[[^]]*\]|（[^）]*）|\([^)]*\)",normalized):flags.append("DOMAIN_OR_USAGE_QUALIFIER")
  if len(normalized)>30:flags.append("LONG_ZH")
  if r["lemma"].casefold() in ("an","eta"):flags.append("KNOWN_FALSE_MATCH")
  if re.search(r"\b(?:etc|something|someone)\b",r["gloss_en"].casefold()):flags.append("ABSTRACT_OEWN_DEFINITION")
  state="EDITORIAL_SINGLE_GLOSS_CANDIDATE" if not flags else "NEEDS_BILINGUAL_DISAMBIGUATION"
  candidate_id=f"staging:v21:zh:{r['rank']}:{r['external_sense_id']}"
  assert candidate_id not in allids;allids.add(candidate_id)
  item={"draft_id":candidate_id,"headword_id":f"core20k:rank:{r['rank']}",
        "rank":r["rank"],"lemma":r["lemma"],"oewn_sense_id":r["external_sense_id"],
        "definition_en":r["gloss_en"],"translation_zh_candidate":normalized or None,
        "translation_zh_wordlevel_source":src,"translation_zh_sense_verified":False,
        "editing_state":state,"risk_flags":flags,
        "learning_render_candidate":{"render_kind":"guided_bilingual_sense_review",
          "question_en":f"Which meaning of '{r['lemma']}' fits this English dictionary definition?",
          "dictionary_definition_en":r["gloss_en"],"proposed_answer_zh":normalized or None},
        "canonical_sense_id":None,"formal_ku_id":None,
        "independent_review":False,"production_ready":False,"release_eligible":False}
  edited.append(item);stats[state]+=1
  for flag in flags:stats["flag:"+flag]+=1
 with (d/"bilingual_ku_editorial_candidates.jsonl").open("w",encoding="utf8") as f:
  for item in edited:f.write(json.dumps(item,ensure_ascii=False)+"\n")
 stats["batches"]+=1
assert stats["batches"]==15 and len(allids)==3266
summary={"metrics":dict(stats),"bilingual_editorial_candidates":len(allids),
 "semantically_certified_senses":0,"production_ready_kus":0,
 "warning":"Word-level ECDICT Chinese is an editing proposal, NEVER an aligned Sense translation."}
(root/"bilingual_editing_manifest.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("V21_BILINGUAL_EDITING_BATCH_PASS",json.dumps(summary,ensure_ascii=False))
