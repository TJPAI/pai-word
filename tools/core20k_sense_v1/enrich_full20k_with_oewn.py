#!/usr/bin/env python3
"""Extend source-bound staging to ALL frozen ranks using OEWN 2025, preserving existing editorial cloze.
Writes 40 shards. Unmatched ranks explicitly recorded; no fabricated senses or certification.
"""
import json,pathlib,collections,gzip
import wn
root=pathlib.Path("tools/core20k_sense_v1/release/core20k-full20k-staging")
lex=wn.Wordnet(lexicon="oewn:2025")
counts=collections.Counter();seen=set()
for batch in range(1,41):
    p=root/f"batch{batch:03d}.jsonl"
    rows=[json.loads(x) for x in p.open(encoding="utf8")]
    for r in rows:
        lemma=r["lemma"];rank=r["rank"];assert rank not in seen;seen.add(rank)
        existing={s["external_sense_id"] for s in r["senses"]}
        for word in lex.words(lemma):
            for sense in word.senses():
                if sense.id in existing:continue
                syn=sense.synset();definition=syn.definition()
                if not definition:continue
                n=len(r["senses"]);sid=sense.id
                r["senses"].append({"external_sense_id":sid,"pos":syn.pos,"definition_en_source":definition,
                                  "gloss_zh_sense_aligned":None,"source_attribution":"OEWN 2025",
                                  "sense_status":"SOURCE_CANDIDATE_REQUIRES_ALIGNMENT"})
                r["ku_drafts"].append({"draft_ku_id":f"staging:full20k:oewn-definition:{rank}:{n:03d}",
                     "linked_external_sense_id":sid,"render_kind":"definition_review",
                     "question":f"Study the following English meaning of '{lemma}': {definition}",
                     "expected_headword":lemma,"question_origin":"OEWN_SOURCE_TEMPLATE_NOT_ORIGINAL_CLOZE",
                     "is_contextual_cloze":False,"release_eligible":False,"production_ready":False})
                existing.add(sid)
        if not r["senses"]:
            r["source_status"]="SOURCE_GAP_NO_SENSE_OR_KU"
        elif any(k.get("is_contextual_cloze") for k in r["ku_drafts"]):
            r["source_status"]="EDITORIAL_CONTEXT_KU_STAGING"
        else:r["source_status"]="ENGLISH_SOURCE_SENSE_AND_DEFINITION_KU_STAGING"
        counts[r["source_status"]]+=1;counts["sense_candidates"]+=len(r["senses"]);counts["ku_drafts"]+=len(r["ku_drafts"])
    p.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in rows),encoding="utf8")
assert len(seen)==20000
report={"total_frozen_headwords":20000,"batches":40,"source_status_counts":{k:v for k,v in counts.items() if k in ("SOURCE_GAP_NO_SENSE_OR_KU","EDITORIAL_CONTEXT_KU_STAGING","ENGLISH_SOURCE_SENSE_AND_DEFINITION_KU_STAGING")},"source_linked_english_senses":counts["sense_candidates"],"ku_draft_records":counts["ku_drafts"],"independent_semantic_certified":0,"production_ready":0,
"method":"OEWN 2025 all frozen headwords, exact lemma lookup; dictionary-definition study cards are NOT original contextual cloze or independently checked pedagogy"}
(root/"oewn_full20k_enriched_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CORE20K_OEWN_FULL_COVERAGE_PASS",json.dumps(report,ensure_ascii=False))
