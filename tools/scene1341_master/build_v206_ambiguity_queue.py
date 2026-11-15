#!/usr/bin/env python3
"""Build source-only Phase1 Kaikki sense ambiguity queue. No automatic sense adjudication."""
import argparse, collections, json, pathlib
p=argparse.ArgumentParser()
for name in ("ledger","evidence","selected-rows","output"): p.add_argument("--"+name,required=True)
a=p.parse_args()
src=json.load(open(a.evidence,encoding="utf8"))
selected=set(json.load(open(a.selected_rows,encoding="utf8")))
queue=[]
for line in open(a.ledger,encoding="utf8"):
 r=json.loads(line); row=r["source_final_row"]; n=r["kaikki_exact_raw_entry_count"]; ns=r["kaikki_candidate_senses"]
 if row in selected or n==0 or (n==1 and ns==1): continue
 entries=src["entries_by_exact_word"].get(r["expression"],[])
 if len(entries)!=n: raise ValueError(f"entry mismatch row {row}")
 candidates=[]
 for e in entries:
  for sense in e.get("senses",[]):
   candidates.append({"raw_source_line":e["raw_source_line"],"lemma":e["word"],"pos":e["pos"],"sense_index_in_native_entry":sense["sense_index_in_native_entry"],"native_glosses":sense.get("glosses",[]),"native_tags":sense.get("tags",[]),"native_example_count":len(sense.get("examples",[]))})
 if len(candidates)!=ns: raise ValueError(f"sense mismatch row {row}")
 queue.append({"source_final_row":row,"record_id":r["record_id"],"scene_id":r["scene_id"],"expression":r["expression"],"cue_zh":r["cue_zh"],"ambiguity_type":"MULTIPLE_NATIVE_ENTRIES" if n>1 else "SINGLE_ENTRY_MULTIPLE_SENSES","native_entry_count":n,"native_sense_count":ns,"native_ipa_candidates":r["kaikki_native_ipa_candidates"],"candidates":candidates,"selected_native_sense":None,"qa_stage_label":"待审","formal_ready":0,"release_allowed":False})
queue.sort(key=lambda x:x["source_final_row"])
counts=collections.Counter(x["ambiguity_type"] for x in queue)
out={"version":"V206","source_archive_sha256":src["archive_sha256"],"purpose":"Exact Kaikki native candidates; no automatic semantic selection","counts":dict(counts),"total":len(queue),"qa_stage":"待审","formal_ready":0,"records":queue}
pathlib.Path(a.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps({"total":len(queue),"counts":dict(counts)},ensure_ascii=False))
