#!/usr/bin/env python3
"""Full20k absence triage: distinguish structural candidates, other-KU-covered and genuinely empty."""
import gzip,json,pathlib,collections
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: ws=json.load(f)["headwords"]
assert len(ws)==20000
dest=pathlib.Path("tools/core20k_sense_v1/release/v2.1-full20k-gap-triage")
dest.mkdir(parents=True,exist_ok=True)
stats=collections.Counter();records=[]
functional=("pron.","det.","conj.","prep.","aux.","modal","interj.")
for rank,lemma,pos,ipa,kus,*_ in ws:
 valid=[k for k in kus if isinstance(k,list) and len(k)>=4 and str(k[1]).casefold()=="sense" and isinstance(k[2],str) and k[2].strip() and isinstance(k[3],str) and k[3].strip()]
 if valid:stats["bilingual_sense_covered"]+=1;continue
 other=sorted(set(str(k[1]) for k in kus if isinstance(k,list) and len(k)>1))
 structural=any(s in str(pos).lower() for s in functional)
 label="FUNCTION_WORD_REQUIRES_GRAMMAR_TRIAGE" if structural else ("NO_BILINGUAL_SENSE_BUT_OTHER_KU" if other else "NO_BILINGUAL_SENSE_NO_KU")
 x={"rank":rank,"lemma":lemma,"pos":pos,"legacy_ku_count":len(kus),"legacy_ku_types":other,"classification":label,"independent_sense_required":None,"release_eligible":False}
 records.append(x);stats[label]+=1
assert stats["bilingual_sense_covered"]+len(records)==20000
with (dest/"gaps_classified.jsonl").open("w",encoding="utf8") as out:
 for x in records:out.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"full_headwords":20000,"missing_sense_headwords":len(records),"metrics":dict(stats),"note":"POS heuristics prioritize review only; no lexical Sense or KU invented."}
(dest/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
print("FULL20K_GAP_TRIAGE_PASS",json.dumps(summary,ensure_ascii=False))
