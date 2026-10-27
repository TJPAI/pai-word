#!/usr/bin/env python3
"""Produce actionable Sense editorial decision ledger and source-risk queue.
No claim of independent semantic certification or arbitrary stable Sense ID minting.
"""
import json,pathlib,collections,re,gzip
root=pathlib.Path("tools/core20k_sense_v1")
data={}
for name in ("editorial_pilot_8_headwords.jsonl","editorial_pilot_12_more_headwords.jsonl"):
 for line in (root/name).read_text(encoding="utf-8").splitlines():
  row=json.loads(line);assert row["lemma"] not in data;data[row["lemma"]]=row
overrides={}
for line in (root/"source_checked_editorial_decisions_003.jsonl").read_text(encoding="utf-8").splitlines():
 row=json.loads(line);overrides[row["lemma"]]=row
assert len(data)==20 and len(overrides)==3
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8") as f: words=json.load(f)["headwords"]
wordmap={w[1].casefold():w for w in words}
out=root/"reports";out.mkdir(exist_ok=True)
stats=collections.Counter()
with (out/"editorial_decision_ledger_20.jsonl").open("w",encoding="utf-8") as f:
 for lemma,entry in data.items():
  w=wordmap.get(lemma.casefold());assert w,lemma
  old=[z[0] for z in w[4] if isinstance(z,list) and len(z)>=4 and str(z[1]).lower()=="sense"]
  proposed=[]
  for i,p in enumerate(entry["sense_proposals"],1):
   proposed.append({"candidate_key":p.get("draft_key",p.get("draft_sense_key",f"{lemma}:{i}")),"pos":p.get("pos",entry.get("pos")),"gloss_en":p["gloss_en"],"gloss_zh":p["gloss_zh"],"action":"PROPOSE_KEEP_PENDING_CROSSCHECK","certified":False})
  corrections=overrides.get(lemma,{}).get("decisions",[])
  result={"rank":w[0],"lemma":lemma,"original_sense_ku_ids":old,"proposed_senses":proposed,
          "special_editorial_decisions":corrections,"review_stage":"AI_EDITED_NOT_CERTIFIED",
          "needs_independent_dictionary_and_context_check":True,
          "old_new_sense_mapping_status":"NOT_MAPPED","safe_to_publish":False}
  f.write(json.dumps(result,ensure_ascii=False)+"\n")
  stats["words"]+=1;stats["proposals"]+=len(proposed);stats["original_sense_ku_ids"]+=len(old)
  stats["special_decisions"]+=len(corrections)
assert stats["words"]==20 and stats["proposals"]==59
summary={"statistics":dict(stats),"frozen_baseline":"V2.0.6","verified_frozen_runtime_lemmas":20,
         "semantic_signoffs":0,"publishable":False,
         "note":"3 prior editorial decisions are historical source-reviewed assertions, not freshly verified in this execution."}
(out/"editorial_decision_ledger_20_summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("EDITORIAL_LEDGER_20",json.dumps(summary,ensure_ascii=False))
