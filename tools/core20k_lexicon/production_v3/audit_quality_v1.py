#!/usr/bin/env python3
"""Read-only full V93 KU coverage and basic quality audit."""
import collections,json,pathlib
B=pathlib.Path(__file__).resolve().parent
def read(pattern):
 for p in sorted(B.glob(pattern)):
  for i,line in enumerate(p.read_text(encoding="utf8").splitlines(),1):
   if line.strip(): yield p.name,i,json.loads(line)
def main():
 src=list(read("recovery/v93_register_20261030/shards/senses_*.jsonl"))
 ku=list(read("ku_drafts/v*/ku_*.jsonl"))
 srcmap={x["teaching_sense_id"]:x for _,_,x in src}
 byid=collections.defaultdict(list); bysense=collections.defaultdict(list); signatures=collections.defaultdict(list)
 invalid=[]; mismatch=[]; nozh=[]; noen=[]
 for f,i,x in ku:
  kid=x.get("ku_id");sid=x.get("teaching_sense_id")
  byid[kid].append((f,i));bysense[sid].append((f,i))
  signatures[(sid,x.get("question"),tuple(x.get("options",[])),x.get("response"))].append((f,i))
  if not kid or not sid or (x.get("render_kind")=="sense_recognition" and (not isinstance(x.get("options"),list) or len(x["options"])!=4 or len(set(x["options"]))!=4 or x.get("response") not in x["options"])): invalid.append([f,i])
  if sid in srcmap and (x.get("lemma")!=srcmap[sid].get("lemma") or x.get("rank")!=srcmap[sid].get("rank")):mismatch.append([f,i,sid])
  if not x.get("gloss_zh"):nozh.append([f,i])
  if not x.get("gloss_en"):noen.append([f,i])
 missing=sorted(set(srcmap)-set(bysense))
 report={"v93_sense_count":len(src),"v93_unique_sense_count":len(srcmap),"ku_files":len(set(f for f,_,_ in ku)),"ku_records":len(ku),"unique_ku_ids":len(byid),"duplicate_ku_id_records":sum(len(v)-1 for v in byid.values()),"unique_ku_sense_ids":len(bysense),"v93_covered":len(set(srcmap)&set(bysense)),"v93_missing":len(missing),"missing_sample":missing[:100],"duplicate_recognition_signatures":sum(len(v)-1 for v in signatures.values()),"multi_ku_sense_count":sum(len(v)>1 for v in bysense.values()),"invalid_structure":len(invalid),"rank_lemma_mismatch":len(mismatch),"missing_chinese_gloss":len(nozh),"missing_english_gloss":len(noen),"invalid_sample":invalid[:30],"mismatch_sample":mismatch[:30],"duplicate_id_sample":[[k,v[:3]] for k,v in byid.items() if len(v)>1][:30]}
 print(json.dumps(report,ensure_ascii=False,indent=2))
 pathlib.Path("enlex_quality_v1_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
if __name__=="__main__":main()
