#!/usr/bin/env python3
"""Non-destructive KU index. Preserve alternatives; do not editorially select conflicting glosses."""
import collections, hashlib, json, pathlib
B=pathlib.Path(__file__).resolve().parent
groups=collections.defaultdict(list)
def canonical_json(v):return json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(",",":"))
for path in sorted(B.glob("ku_drafts/v*/ku_*.jsonl")):
 for line_no,line in enumerate(path.read_text(encoding="utf8").splitlines(),1):
  if not line.strip():continue
  row=json.loads(line)
  key=row.get("ku_id")
  if not key:raise ValueError("missing ku_id at %s:%d"%(path,line_no))
  groups[key].append((str(path.relative_to(B)),line_no,row))
def normalize_pos(p):
 return {"a":"adj","s":"adj","adjective":"adj","n":"n","noun":"n","v":"v","verb":"v","r":"adv","adverb":"adv"}.get(str(p or "").lower(),str(p or "").lower())
index=[];summary=collections.Counter()
for ku_id,records in sorted(groups.items()):
 distinct={}
 for path,line,row in records:
  identity=(row.get("teaching_sense_id"),row.get("rank"),row.get("lemma"),row.get("response"))
  digest=hashlib.sha256(canonical_json(row).encode()).hexdigest()
  distinct.setdefault(digest,[]).append((path,line,row))
 summaries=[(k,items[0][2],len(items),items[0][0],items[0][1]) for k,items in sorted(distinct.items())]
 identities={canonical_json((r.get("teaching_sense_id"),r.get("rank"),r.get("lemma"),r.get("response"))) for _,r,_,_,_ in summaries}
 if len(identities)!=1:raise ValueError("conflicting KU identity: "+ku_id)
 en={r.get("gloss_en") or r.get("definition_en") for _,r,_,_,_ in summaries}
 zh={r.get("gloss_zh") for _,r,_,_,_ in summaries}
 pos={normalize_pos(r.get("pos")) for _,r,_,_,_ in summaries}
 different_gloss=len(en)>1 or len(zh)>1
 variants=[{"sha256":digest,"path":path,"line":line,"copies":copies} for digest,r,copies,path,line in summaries]
 entry={"ku_id":ku_id,"teaching_sense_id":records[0][2].get("teaching_sense_id"),"variants":variants,"requires_gloss_review":different_gloss,"requires_pos_review":len(pos)>1}
 if different_gloss:summary["requires_gloss_review"]+=1
 if len(pos)>1:summary["requires_pos_review"]+=1
 if len(variants)>1:summary["multiple_full_record_variants"]+=1
 summary["exact_duplicate_extra_records"]+=len(records)-len(variants)
 index.append(entry)
summary.update({"unique_ku_ids":len(groups),"total_records":sum(len(x) for x in groups.values()),"total_distinct_full_record_variants":sum(len(x["variants"]) for x in index)})
out=B/"ku_canonical_index.jsonl"
out.write_text("".join(canonical_json(r)+"\n" for r in index),encoding="utf8")
(B/"ku_canonical_summary.json").write_text(json.dumps(dict(summary),ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps(dict(summary),ensure_ascii=False))
