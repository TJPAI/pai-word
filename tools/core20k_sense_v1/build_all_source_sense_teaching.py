#!/usr/bin/env python3
"""Create useful SOURCE-BOUND Sense teaching draft layers for every attested source Sense.
No false bilingual alignment; no pretend original cloze. Preserve source and QA gate.
"""
import pathlib,json,collections,re
root=pathlib.Path("tools/core20k_sense_v1/reports/oewn-full20k-staging")
counter=collections.Counter()
for batch in range(1,41):
 p=root/f"batch{batch:03d}.jsonl";rows=[json.loads(s) for s in p.open(encoding="utf8")]
 draft=[]
 for row in rows:
  lemma=row["lemma"];rank=row["rank"]
  native=[q for q in row["ku_drafts"] if q.get("question_origin")=="FROZEN_RUNTIME_EXISTING_KU" and q.get("native_ku_type","").lower()=="sense"]
  for index,s in enumerate(row["senses"]):
   sid=s["external_sense_id"];en=s["definition_en_source"].strip()
   if not en:continue
   candidates=[{"gloss_zh":q["native_payload"][2],"gloss_en":q["native_payload"][3],"source_ku_id":q["native_original_ku_id"],"alignment_status":"UNVERIFIED_WORDLEVEL_NOT_SENSE_ALIGNED"} for q in native if len(q["native_payload"])>=4 and q["native_payload"][2]]
   lesson={"headword_id":row["headword_id"],"rank":rank,"lemma":lemma,
    "draft_sense_id":f"staging:source-sense:{rank}:{index:03d}","external_sense_id":sid,
    "sense_en":en,"sense_pos":s.get("pos"),"source":s.get("source","OEWN2025"),
    "zh_gloss_editorial":None,"zh_native_reference_candidates":candidates[:12],
    "ku_id":f"staging:source-sense-recall:{rank}:{index:03d}","ku_type":"sense_recognition",
    "render_kind":"source_definition_word_recall",
    "question_zh":"阅读英文释义，回忆对应的英文词头。",
    "question_en":en,"response":lemma,
    "teaching_note_en":"Source definition only; sense frequency and context have not been selected.",
    "original_context_ku":False,"independent_review":False,"release_eligible":False,"production_ready":False}
   draft.append(lesson);counter["sense_ku_drafts"]+=1
   if candidates:counter["sense_with_wordlevel_zh_candidates"]+=1
  counter["headwords"]+=1
 (root/f"teaching_batch{batch:03d}.jsonl").write_text("".join(json.dumps(d,ensure_ascii=False)+"\n" for d in draft),encoding="utf8")
assert counter["headwords"]==20000 and counter["sense_ku_drafts"]==60204
report={"batches":40,"headwords":counter["headwords"],"sense_bound_english_teaching_drafts":counter["sense_ku_drafts"],
 "sense_with_wordlevel_zh_reference_candidates":counter["sense_with_wordlevel_zh_candidates"],
 "new_original_context_ku":0,"sense_aligned_zh_verified":0,"production_ready":0,
 "warning":"These are actual source-bound definition recall KU drafts; not original contextual examples or bilingual Sense certification."}
(root/"full20k_teaching_draft_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("FULL20K_TEACHING_DRAFTS_PASS",json.dumps(report,ensure_ascii=False))
