#!/usr/bin/env python3
"""Full 20k OEWN Sense/KU provisional packs, one source-definition review KU per sourced Sense.
Does not generate unsourced senses, bilingual alignment, contextual cloze, or production certifications.
"""
import json,pathlib,collections
base=pathlib.Path("tools/core20k_sense_v1/reports")
source=base/"oewn2025_full20k_sense_candidates.jsonl"
out=base/"oewn-full20k-staging"
out.mkdir(parents=True,exist_ok=True)
counts=collections.Counter();seen=set();buffers={}
for line in source.open(encoding="utf8"):
    w=json.loads(line);rank=w["rank"];lemma=w["lemma"]
    assert 1<=rank<=20000 and rank not in seen;seen.add(rank)
    senses=w["oewn_candidates"];cards=[]
    for i,s in enumerate(senses):
        sid=s["oewn_sense_id"];gloss=s["gloss_en"]
        assert sid and gloss
        cards.append({"draft_ku_id":f"staging:oewn2025:definition-review:{rank}:{i:03d}",
                      "linked_external_sense_id":sid,"render_kind":"definition_review",
                      "question":f"Review the English definition of '{lemma}': {gloss}",
                      "response_candidate":lemma,"source":"Open English WordNet 2025",
                      "original_contextual_cloze":False,"release_eligible":False,"production_ready":False})
    state="OEWN_SOURCE_SENSE_AND_DEFINITION_KU_DRAFT" if senses else "OEWN_NO_MATCH_SOURCE_GAP"
    rec={"rank":rank,"headword_id":f"core20k:rank:{rank}","lemma":lemma,"state":state,
         "senses":[{"external_sense_id":s["oewn_sense_id"],"external_synset_id":s["oewn_synset_id"],
                    "pos":s["pos"],"definition_en_source":s["gloss_en"],
                    "gloss_zh_sense_aligned":None,"semantic_certified":False} for s in senses],
         "ku_drafts":cards,"production_ready":False}
    buffers.setdefault((rank-1)//500+1,[]).append(rec)
    counts[state]+=1;counts["source_sense_candidates"]+=len(senses)
    counts["definition_review_ku_drafts"]+=len(cards)
assert len(seen)==20000 and len(buffers)==40
for batch,rows in sorted(buffers.items()):
    assert len(rows)==500
    (out/f"batch{batch:03d}.jsonl").write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in rows),encoding="utf8")
report={"headwords":len(seen),"batches":40,"matched_headwords":counts["OEWN_SOURCE_SENSE_AND_DEFINITION_KU_DRAFT"],
"unmatched_headwords":counts["OEWN_NO_MATCH_SOURCE_GAP"],"source_sense_candidates":counts["source_sense_candidates"],
"source_bound_definition_review_ku_drafts":counts["definition_review_ku_drafts"],
"original_contextual_cloze_created_by_this_job":0,"semantic_certified":0,"production_ready":0,
"warning":"One definition-review KU per exact OEWN sense; this is candidate coverage, NOT independently reviewed original-context KU."}
(out/"manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CORE20K_FULL_OEWN_SENSE_KU_PACK_PASS",json.dumps(report,ensure_ascii=False))
