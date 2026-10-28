#!/usr/bin/env python3
"""Build 20,000-headword Sense/KU source-bound staging coverage, without inventing senses.
All cards are provisional; OEWN links only where source evidence exists.
"""
import json,gzip,pathlib,collections,hashlib
base=pathlib.Path("tools/core20k_sense_v1/release")
out=base/"core20k-full20k-staging"
out.mkdir(parents=True,exist_ok=True)
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: frozen=json.load(f)["headwords"]
assert len(frozen)==20000
evidence=base/"v21-missing-batch-all/missing_lexical_sense_evidence.jsonl"
source={}
for line in evidence.open(encoding="utf8"):
    r=json.loads(line)
    assert r["rank"] not in source
    source[r["rank"]]=r
existing={}
for path in sorted((base/"v21-missing-batch500-all").glob("bilingual_sense_ku_curated_batch[0-9][0-9].jsonl")):
    for line in path.open(encoding="utf8"):
        r=json.loads(line)
        assert r["rank"] not in existing
        existing[r["rank"]]=r
other=base/"v21-missing-batch-all/newly_resolved_sense_ku_editorial.jsonl"
for line in other.open(encoding="utf8"):
    r=json.loads(line)
    assert r["rank"] not in existing
    existing[r["rank"]]=r
counts=collections.Counter();sense_count=0;ku_count=0;ids=set()
for start in range(1,20001,500):
    rows=[]
    for rank in range(start,min(20000,start+499)+1):
        w=frozen[rank-1];lemma=w[1];s=source.get(rank);curated=existing.get(rank)
        if s:assert s["lemma"].casefold()==lemma.casefold()
        if curated:assert curated["lemma"].casefold()==lemma.casefold()
        senses=[]
        if s:
            for n,c in enumerate(s["oewn_sense_candidates"]):
                sid=c["oewn_sense_id"]
                senses.append({"external_sense_id":sid,"pos":c["pos"],"definition_en_source":c["gloss_en"],"gloss_zh_sense_aligned":None,"source_attribution":"OEWN source evidence","sense_status":"SOURCE_CANDIDATE_REQUIRES_ALIGNMENT"})
        if curated and not any(c["external_sense_id"]==curated["oewn_sense_id"] for c in senses):
            senses.append({"external_sense_id":curated["oewn_sense_id"],"pos":None,"definition_en_source":curated["definition_en_source"],"gloss_zh_sense_aligned":None,"source_attribution":"Existing editorial linked OEWN record","sense_status":"SOURCE_CANDIDATE_REQUIRES_ALIGNMENT"})
        cards=[]
        for n,c in enumerate(senses):
            sid=c["external_sense_id"]
            id=f"staging:full20k:definition-recognition:{rank}:{n:03d}"
            assert id not in ids;ids.add(id)
            cards.append({"draft_ku_id":id,"linked_external_sense_id":sid,
                          "render_kind":"definition_review","question":"Study the following English meaning of '"+lemma+"': "+c["definition_en_source"],
                          "expected_headword":lemma,"question_origin":"OEWN_SOURCE_TEMPLATE_NOT_ORIGINAL_CLOZE",
                          "is_contextual_cloze":False,"release_eligible":False,"production_ready":False})
        if curated:
            cards.append({"draft_ku_id":curated["draft_ku_id"],"linked_external_sense_id":curated["oewn_sense_id"],
                          "render_kind":curated["render_kind"],"question":curated["prompt"],
                          "expected_headword":curated["correct_answer"],"question_origin":"AI_EDITED_STAGING_CLOZE",
                          "is_contextual_cloze":True,"release_eligible":False,"production_ready":False})
        if curated:status="EDITORIAL_CONTEXT_KU_STAGING"
        elif senses:status="ENGLISH_SOURCE_SENSE_AND_DEFINITION_KU_STAGING"
        else:status="SOURCE_GAP_NO_SENSE_OR_KU"
        counts[status]+=1;sense_count+=len(senses);ku_count+=len(cards)
        rows.append({"rank":rank,"headword_id":f"core20k:rank:{rank}","lemma":lemma,
                     "source_status":status,"wordlevel_zh_unverified":s.get("ecdict_translation_zh_wordlevel") if s else None,
                     "senses":senses,"ku_drafts":cards,"independent_semantic_certified":False,"production_ready":False})
    assert len(rows)==min(500,20001-start)
    (out/f"batch{(start-1)//500+1:03d}.jsonl").write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in rows),encoding="utf8")
assert sum(counts.values())==20000
report={"total_frozen_headwords":20000,"batches":40,"evidence_headwords_in_missing_subset":len(source),
        "curated_headwords":len(existing),"source_status_counts":dict(counts),
        "sourced_english_sense_candidates":sense_count,"source_bound_definition_recognition_ku_drafts":sense_count,
        "editorial_contextual_ku_drafts":len(existing),"total_ku_draft_records":ku_count,
        "source_missing_headwords":counts["SOURCE_GAP_NO_SENSE_OR_KU"],
        "independent_semantic_certified":0,"production_ready":0,
        "warning":"Full roster coverage is NOT full Sense/KU content coverage. ECDICT word-level gloss must not be assigned to an OEWN sense."}
(out/"manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CORE20K_FULL_ROSTER_STAGING_PASS",json.dumps(report,ensure_ascii=False))
