#!/usr/bin/env python3
"""V159: fail-closed POS-context join. Inputs: V158 QA JSON and four CGMASTER author draft files in the same directory."""
import collections,json,sys
from pathlib import Path
folder=Path(sys.argv[1]); src=json.loads((folder/"CGMASTER_V158_SC0011_0014_86_POS_REGION_QA_QUEUE_20261114.json").read_text(encoding="utf-8"))
names=["CGMASTER_V128_SC0011_ALL255_BILINGUAL_DRAFT_20261114.json","CGMASTER_V134_SC0012_ALL253_BILINGUAL_DRAFT_20261114.json","CGMASTER_V142_SC0013_ALL245_BILINGUAL_DRAFT_20261114.json","CGMASTER_V147_SC0014_ALL243_BILINGUAL_DRAFT_20261114.json"]
rows={}
for name in names:
 for q in json.loads((folder/name).read_text(encoding="utf-8"))["records"]:
  assert q["record_id"] not in rows
  rows[q["record_id"]]=q
# This POS decision is from illustrative example grammar, NOT from the authoritative Reviewed Master.
pos={"SC1341-FINAL-SRC-45d568908d34655f20de3d5995be5c79":"noun","SC1341-FINAL-SRC-781851e817a12f9037f406e974cf4b62":"noun","SC1341-FINAL-SRC-dd61346cbb36bd42f8543cd1d207472f":"verb","SC1341-FINAL-SRC-60aaf371c516c0c5d011eddd7e2003a0":"adj","SC1341-FINAL-SRC-1f5fc5b2429ae8f16b3d4627e47b3de2":"adj","SC1341-FINAL-SRC-3486e39f65f5e1f62dde551bf4649d11":"adj","SC1341-FINAL-SRC-a93e340a8eef1b624c9f51ae8519a7c2":"adj"}
out=[]
for r in src["records"]:
 if r["record_id"] not in pos: continue
 q=rows[r["record_id"]]
 assert r["expression"]==q["question_page"]["english_expression"] and r["source_final_row"]==q["source_final_row"]
 assert q["canonical_sense_id"] is None and q["cg_qa_status"]=="DEFERRED"
 matched=r["pos_conditional_ipa"].get(pos[r["record_id"]])
 flags=["ONLY_POS_CONDITIONAL_US_IPA_BELONGS_TO_ANOTHER_POS"] if not matched else []
 if r["expression"]=="marathon": flags.append("ONLY_US_TAGGED_POS_IS_NAME_NOT_COMMON_NOUN")
 out.append(dict(record_id=r["record_id"],source_final_row=r["source_final_row"],scene_id=r["scene_id"],expression=r["expression"],meaning_zh_source=r["meaning_zh_source"],
  author_draft_context=dict(question_cue_zh=q["question_page"]["cue_zh"],example_en=q["answer_page"]["example_en"],usage_note=q["answer_page"]["usage_note"],inferred_context_pos=pos[r["record_id"]],pos_inference_authority="EDITORIAL_CONTEXT_INFERENCE_NOT_REVIEWED_MASTER"),
  kaikki_us_pos_conditional_ipa=r["pos_conditional_ipa"],context_pos_source_ipa=matched,qa_status="CONTEXT_POS_US_IPA_SOURCE_MATCH_QA_HOLD" if matched else "REJECT_V158_POS_UNIQUE_SHORTCUT_HOLD",risk_flags=flags,
  source_sha256=r["source_sha256"],source_evidence=r["source_evidence"],canonical_sense_id=None,reviewed_master_pos=None,approved_ipa=None,qa_approved=False,release_allowed=False))
counts=dict(collections.Counter(x["qa_status"] for x in out))
assert len(out)==7 and counts=={"REJECT_V158_POS_UNIQUE_SHORTCUT_HOLD":4,"CONTEXT_POS_US_IPA_SOURCE_MATCH_QA_HOLD":3}
result=dict(version="V159",input_version="V158",source_kaikki_sha256=src["source_sha256"],source_author_draft_files=names,counts=counts,records=out,formal_approved=0,release_allowed=False,notes="Teacher example POS is editorial inference, not authoritative Reviewed Master POS/Sense.")
(folder/"CGMASTER_V159_7_TARGET_POS_CONTEXT_CROSSCHECK_20261114.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
print(counts)
