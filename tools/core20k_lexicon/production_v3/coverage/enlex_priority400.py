#!/usr/bin/env python3
"""Prioritize source-backed 400 gloss candidates per batch, not semantic certification."""
import argparse,collections,hashlib,json,pathlib,re
ROOT=pathlib.Path("tools/core20k_lexicon/production_v3/coverage")
def main():
 p=argparse.ArgumentParser();p.add_argument("--input",required=True);p.add_argument("--out",required=True);a=p.parse_args()
 rows=[json.loads(s) for s in pathlib.Path(a.input).read_text(encoding="utf-8").splitlines() if s.strip()]
 assert len(rows)==2000
 assert len(set(x["teaching_sense_id"] for x in rows))==2000
 HAN=re.compile("[\\u3400-\\u9fff]")
 BAD=re.compile(r"[+*/=<>|{}@A-Za-z0-9]")
 def assess(r):
  zh=r["chinese_lexicalizations"]
  valid=[x for x in zh if HAN.search(x) and not BAD.search(x) and not any(c in x for c in "[]\\") and len(x)<=12]
  clean=sorted(set(valid),key=lambda x:(len(x),x))
  flags=[]
  if len(zh)>1:flags.append("MULTIPLE_SOURCE_LEXEMES")
  if len(valid)!=len(zh):flags.append("OMW_FORMAT_NOISE")
  if len(str(r["definition_en"]).split())<5:flags.append("SHORT_EN_DEFINITION")
  if r["lane"]=="EDITORIALLY_TRIAGED":flags.append("ALREADY_EDITORIAL_TRIAGED")
  gloss=clean[0] if len(clean)==1 else None
  tier=("EXISTING_EDITORIAL" if r["lane"]=="EDITORIALLY_TRIAGED" else
        "SINGLE_SOURCE_LEXEME_NEEDS_FIT_REVIEW" if gloss and not flags else
        "MULTI_LEXEME_NEEDS_AI_DISAMBIGUATION" if len(clean)>1 else
        "EXTERNAL_EXAMPLE_NEEDED")
  return tier,flags,gloss,clean
 scored=[]
 for r in rows:
  tier,flags,gloss,clean=assess(r)
  priority={"SINGLE_SOURCE_LEXEME_NEEDS_FIT_REVIEW":0,"MULTI_LEXEME_NEEDS_AI_DISAMBIGUATION":1,"EXTERNAL_EXAMPLE_NEEDED":2,"EXISTING_EDITORIAL":3}[tier]
  scored.append((priority,r["rank"],r["teaching_sense_id"],r,tier,flags,gloss,clean))
 scored.sort(key=lambda x:x[:3])
 selected=scored[:400]
 out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
 path=out/"priority400_editorial_cards.jsonl"
 with path.open("w",encoding="utf-8") as fh:
  for _,_,_,r,tier,flags,gloss,clean in selected:
   card={"teaching_sense_id":r["teaching_sense_id"],"rank":r["rank"],"lemma":r["lemma"],"synset_id":r["synset_id"],"definition_en":r["definition_en"],"source_lexemes":r["chinese_lexicalizations"],"candidate_zh":gloss,
   "candidate_status":"UNVERIFIED_SOURCE_LEXEME" if gloss else "NO_AUTO_GLOSS",
   "priority_tier":tier,"rule_risks":flags,"review_question":"Does the candidate Chinese lexicalization precisely express this specific English definition and part of speech?",
   "review_depth":"DETERMINISTIC_PRIORITY_ONLY","semantic_reviewed":False,"independent_certified":False,"production_ready":False}
   fh.write(json.dumps(card,ensure_ascii=False)+"\n")
 manifest={"source_rows":len(rows),"selected":400,"unique_selected":len(set(x[2] for x in selected)),"tier_counts":dict(collections.Counter(x[4] for x in selected)),
  "new_semantic_reviews":0,"independent_certified":0,"production_ready":0,
  "source_sha256":hashlib.sha256(pathlib.Path(a.input).read_bytes()).hexdigest(),"output_sha256":hashlib.sha256(path.read_bytes()).hexdigest()}
 (out/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print(json.dumps(manifest,indent=2,ensure_ascii=False))
if __name__=="__main__":main()
