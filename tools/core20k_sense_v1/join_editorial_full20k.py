#!/usr/bin/env python3
"""Join previously authored bilingual cloze onto full-OEWN staging packs; no semantic auto-certification."""
import json,pathlib,collections
root=pathlib.Path("tools/core20k_sense_v1")
source=root/"release/v21-missing-batch500-all"
extra=root/"release/v21-missing-batch-all/newly_resolved_sense_ku_editorial.jsonl"
out=root/"reports/oewn-full20k-staging"
# Actions artifacts can be unpacked without the original common folder prefix.
candidates=sorted(pathlib.Path(".").rglob("bilingual_sense_ku_curated_batch27.jsonl"))
if candidates: source=candidates[0].parent
extras=sorted(pathlib.Path(".").rglob("newly_resolved_sense_ku_editorial.jsonl"))
if extras: extra=extras[0]
editorial={}
for path in sorted(source.glob("bilingual_sense_ku_curated_batch[0-9][0-9].jsonl"))+([extra] if extra.exists() else []):
    for line in path.open(encoding="utf8"):
        r=json.loads(line)
        assert r["rank"] not in editorial
        editorial[r["rank"]]=r
found=set();metrics=collections.Counter();unmatched=[]
for batch in range(1,41):
    p=out/f"batch{batch:03d}.jsonl"
    rows=[json.loads(line) for line in p.open(encoding="utf8")]
    for w in rows:
        r=editorial.get(w["rank"])
        if not r:continue
        assert w["lemma"].casefold()==r["lemma"].casefold()
        sid=r["oewn_sense_id"]
        linked=any(x["external_sense_id"]==sid for x in w["senses"])
        if not linked:
            unmatched.append({"rank":w["rank"],"lemma":w["lemma"],"oewn_sense_id":sid,"reason":"EDITORIAL_OEWN_SENSE_NOT_IN_2025_PACK"})
        w["ku_drafts"].append({"draft_ku_id":r["draft_ku_id"],"linked_external_sense_id":sid,
             "render_kind":r["render_kind"],"question":r["prompt"],"correct_answer":r["correct_answer"],
             "gloss_zh_editorial_unverified":r["gloss_zh_editorial"],
             "question_origin":"AI_ORIGINAL_CONTEXTUAL_CLOZE_STAGING",
             "original_contextual_cloze":True,"sense_link_in_current_oewn":linked,
             "release_eligible":False,"production_ready":False})
        w["source_existing_editorial_ku"]=True;found.add(w["rank"])
        metrics["linked" if linked else "unlinked"]+=1
    p.write_text("".join(json.dumps(w,ensure_ascii=False)+"\n" for w in rows),encoding="utf8")
assert found==set(editorial)
assert len(found)>=1482, f"Missing archived drafts: {len(found)}, source={source}, extra={extra.exists()}"
(out/"editorial_oewn_unlinked_review.jsonl").write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in unmatched),encoding="utf8")
report={"editorial_staging_cloze_attached":len(found),"missing_historical_extra_file":not extra.exists(),"sense_id_exact_matched":metrics["linked"],"sense_id_unmatched_review":metrics["unlinked"],"production_ready":0,"independently_certified":0}
(out/"editorial_merge_manifest.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("CORE20K_FULL_EDITORIAL_JOIN_PASS",json.dumps(report))
