#!/usr/bin/env python3
"""Produce auditable ENLEX review packets and ENTEACH binding requests.
Candidate alignments are not certified senses. No automated releases.
"""
import json,pathlib,collections,hashlib
root=pathlib.Path("tools/core20k_sense_v1/reports")
alignment=root/"cross_source_merged/core20k_oewn2025_kaikki_alignment_merged.jsonl"
handoff=root/"enlex_enteach_handoff/v206_sense_ku_staging_20k.jsonl"
outdir=root/"v21_review_packets";outdir.mkdir(parents=True,exist_ok=True)
words={}
for line in handoff.open(encoding="utf8"):
 r=json.loads(line);words[r["rank"]]=r
assert len(words)==20000
counts=collections.Counter();seen=set()
with (outdir/"enlex_sense_review_candidates.jsonl").open("w",encoding="utf8") as sf, (outdir/"enteach_ku_binding_queue.jsonl").open("w",encoding="utf8") as kf:
 for line in alignment.open(encoding="utf8"):
  r=json.loads(line);rank=r["rank"];assert rank not in seen
  seen.add(rank);w=words[rank]
  pairs=sorted(r["pairs"],key=lambda p:-p["cosine"])
  for pair in pairs:
   # Similarity is triage ordering only. Stable draft key is based on source evidence.
   key=hashlib.sha256((str(rank)+"|"+str(pair["oewn_index"])+"|"+str(pair["kaikki_index"])).encode()).hexdigest()[:16]
   sf.write(json.dumps({"headword_id":None,"rank":rank,"lemma":r["lemma"],"draft_sense_key":"align:"+key,
    "oewn_gloss":pair["oewn_gloss"],"kaikki_gloss":pair["kaikki_gloss"],
    "cosine":pair["cosine"],"pos":pair["pos"],"gloss_zh":None,
    "canonical_sense_id":None,"review_status":"CROSS_SOURCE_SEMANTIC_REVIEW_REQUIRED",
    "checks":["meaning_equivalence","lexical_pos","sense_specific_chinese_gloss","sense_distinction","usage_examples"],
    "release_eligible":False},ensure_ascii=False)+"\n")
   counts["sense_review_pairs"]+=1
  for old in w["sense_candidates"]:
   kf.write(json.dumps({"rank":rank,"lemma":r["lemma"],"legacy_ku_id":old["legacy_ku_id"],
    "legacy_gloss_en":old["gloss_en"],"legacy_gloss_zh":old["gloss_zh"],
    "canonical_sense_id":None,"required_action":"MAP_LEGACY_KU_TO_CERTIFIED_SENSE",
    "candidate_source_pairs":len(pairs),"retain_legacy_identity":True,
    "teaching_qa_passed":False,"release_eligible":False},ensure_ascii=False)+"\n")
   counts["legacy_ku_binding_requests"]+=1
  counts["headwords"]+=1;counts["headwords_with_alignment"]+=bool(pairs)
assert seen==set(range(1,20001))
assert counts["sense_review_pairs"]>0
report={"stats":dict(counts),"version":"Core20K V2.1 Content staging",
 "canonical_sense_certified":0,"ku_production_ready":0,
 "warning":"No Chinese sense-specific gloss can be assigned from word-level ECDICT translation without semantic review."}
(outdir/"v21_review_packet_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("V21_REVIEW_PACKET_OK",json.dumps(report,ensure_ascii=False))
