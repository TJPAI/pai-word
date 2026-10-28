#!/usr/bin/env python3
"""Produce new lexical Sense/KU candidates for previously empty words, guarded by strict one-to-one evidence.
This is provisional word-level bilingual mapping, never independently certified."""
import json,pathlib,gzip,re,collections
root=pathlib.Path("tools/core20k_sense_v1/release/v2.1-missing-first1000-sourced")
source=[json.loads(s) for s in (root/"oewn_english_sense_production_candidates.jsonl").open(encoding="utf8")]
previous={"january","february","april","june","september","october","november","december","monday","sunday","digitization","questioner","discussant","roomful","humanize","experienced","informer"}
# Drafts only when dictionary evidence is a simple, independently identifiable translation.
# No word-level Chinese polysemy is silently assigned to a particular synset.
exclusions=re.compile(r"[\[\]（）()；;\n/,]|\b(?:n|v|vt|vi|adj|adv|prep|conj|pron)\.",re.I)
picks=[]
for r in source:
 if r["lemma"].casefold() in previous or len(r["candidate_senses"])!=1:continue
 zh=(r.get("word_level_zh_evidence") or "").strip()
 if not zh or exclusions.search(zh) or len(zh)>9:continue
 ss=r["candidate_senses"][0]
 en=ss.get("gloss_en","").strip()
 if len(en)<12:continue
 picks.append((r,ss,zh))
picks.sort(key=lambda v:v[0]["rank"])
out=[]
for r,ss,zh in picks[:100]:
 rank=r["rank"];lemma=r["lemma"]
 out.append({"rank":rank,"lemma":lemma,"headword_id":f"core20k:rank:{rank}",
 "external_sense_id":ss["external_sense_id"],"gloss_en":ss["gloss_en"],
 "zh_wordlevel_candidate":zh,"editorial_gloss_zh":None,
 "sense_review_status":"WORD_LEVEL_ZH_SINGLETON_REQUIRES_AI_EDITORIAL",
 "draft_ku":{"draft_ku_id":f"staging:v21:new:{rank}:recognition01","render_kind":"guided_sense_recognition",
 "question":f"In the dictionary sense below, what does '{lemma}' mean in Chinese?",
 "english_definition":ss["gloss_en"],"answer_candidate_zh":zh,
 "review_status":"TRANSLATION_AND_ASSESSMENT_PENDING"},
 "canonical_sense_id":None,"release_eligible":False,"production_ready":False})
assert len(out)>0
(root/"next100_lexical_sense_ku_candidates.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in out),encoding="utf8")
print("NEXT100_REAL_SOURCE_CANDIDATES",json.dumps({"found_eligible":len(picks),"exported":len(out),"new_certified_senses":0,"new_certified_kus":0}))
