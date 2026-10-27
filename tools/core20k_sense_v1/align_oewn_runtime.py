#!/usr/bin/env python3
"""Cross-inventory candidate coverage and exact lexical overlap. No automatic semantic PASS."""
import json,gzip,re,pathlib,collections
b=pathlib.Path("tools/core20k_sense_v1/reports")
rows={w[0]:w for w in json.load(gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf-8"))["headwords"]}
def tokens(t):return set(re.findall(r"[a-z]+",str(t).lower()))-{"a","an","the","of","to","for","and","or","one","something","someone","that","with","in","on"}
count=collections.Counter()
with (b/"oewn_vs_runtime_review.jsonl").open("w",encoding="utf-8") as out:
 for line in (b/"oewn_full20k_sense_candidates.jsonl").open(encoding="utf-8"):
  x=json.loads(line); rank=x["rank"]; w=rows[rank];assert x["lemma"].casefold()==w[1].casefold()
  senses=[q for q in w[4] if isinstance(q,list) and len(q)>=4 and str(q[1]).lower()=="sense"]
  oewn=x["oewn_candidates"]
  candidates=[]
  for candidate in oewn:
   def overlap(old):
    aa=tokens(candidate.get("gloss_en",""));bb=tokens(old[3])
    return round(len(aa&bb)/len(aa|bb),4) if aa and bb else 0
   matches=sorted(((overlap(old),old[0]) for old in senses),reverse=True)
   best=matches[0] if matches else (0,None)
   candidates.append({"oewn_sense_id":candidate["oewn_sense_id"],"source_synset":candidate["oewn_synset_id"],"gloss_en":candidate["gloss_en"],"heuristic_overlap":best[0],"nearest_source_ku_id":best[1],"alignment_status":"LEXICAL_HINT_ONLY_NOT_SEMANTIC_VERIFIED"})
  category=("NO_BOTH" if not senses and not oewn else "OEWN_ONLY" if oewn and not senses else "RUNTIME_ONLY" if senses and not oewn else "BOTH_PRESENT")
  count[category]+=1;count["OEWN_candidates"]+=len(oewn);count["runtime_sense_ku"]+=len(senses)
  if category=="BOTH_PRESENT":count["lexical_overlap_above_0_25"]+=sum(z["heuristic_overlap"]>=0.25 for z in candidates)
  out.write(json.dumps({"rank":rank,"lemma":x["lemma"],"category":category,"runtime_sense_kus":[{"ku_id":q[0],"gloss_zh":q[2],"gloss_en":q[3]} for q in senses],"oewn_candidates":candidates,"review_status":"PENDING_SEMANTIC_EVALUATION"},ensure_ascii=False)+"\n")
assert sum(count[k] for k in ("NO_BOTH","OEWN_ONLY","RUNTIME_ONLY","BOTH_PRESENT"))==20000
report={"categories":{k:count[k] for k in ("NO_BOTH","OEWN_ONLY","RUNTIME_ONLY","BOTH_PRESENT")},"counts":dict(count),"method":"Jaccard lexical tokens for prioritization only, not semantic equivalence","verified_semantic_alignments":0,"auto_certified_senses":0}
(b/"oewn_runtime_alignment_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("SENSE_CROSS_ALIGN",json.dumps(report,ensure_ascii=False))
