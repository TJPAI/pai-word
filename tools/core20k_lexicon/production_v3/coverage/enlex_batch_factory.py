#!/usr/bin/env python3
"""Batch factory: 2000 records per batch, source-preserving, fail closed.
A machine-prepared candidate is NEVER a semantic review or a certified gloss.
"""
import argparse,collections,hashlib,json,pathlib,re
BASE=pathlib.Path("tools/core20k_lexicon/production_v3/coverage")
SOURCE=BASE/"omw_zh_gap_persistence"
def load(p):
 with p.open(encoding="utf-8") as f:
  for n,line in enumerate(f,1):
   try:yield json.loads(line)
   except Exception as e:raise ValueError(f"{p}:{n}: {e}")
def main():
 p=argparse.ArgumentParser();p.add_argument("--batch-size",type=int,default=2000);p.add_argument("--out",default=str(BASE/"batch_factory_output"));a=p.parse_args()
 assert a.batch_size in (500,1000,2000)
 files=sorted(SOURCE.glob("candidates_*.jsonl"));assert len(files)==15
 rows=[r for f in files for r in load(f)];assert len(rows)==7302
 ids=[r["teaching_sense_id"] for r in rows];assert len(set(ids))==7302
 reviewed={}
 editorial=sorted(BASE.glob("omw_single_lexeme_editorial_[0-9][0-9][0-9].jsonl"))
 assert len(editorial)>=6
 for f in editorial:
  for r in load(f):
   key=r["teaching_sense_id"];assert key not in reviewed,(f,key)
   reviewed[key]=r
 assert set(reviewed)<=set(ids)
 bad=re.compile(r"[+*/=<>|{}\\[\\]@A-Za-z0-9]")
 out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
 cards=[];counts=collections.Counter()
 for r in rows:
  zh=r["chinese_lexicalizations"]
  invalid=[x for x in zh if not re.search("[\\u3400-\\u9fff]",x) or bad.search(x) or len(x)>12]
  old=reviewed.get(r["teaching_sense_id"])
  if old: lane="EDITORIALLY_TRIAGED"
  elif invalid:lane="FORMAT_OR_LEXEME_RISK"
  elif len(zh)>1:lane="MULTIPLE_LEXEMES_NEED_SELECTION"
  else:lane="SINGLE_LEXEME_NEED_SEMANTIC_REVIEW"
  counts[lane]+=1
  cards.append({"teaching_sense_id":r["teaching_sense_id"],"rank":r["rank"],"lemma":r["lemma"],"synset_id":r["synset_id"],"definition_en":r["definition_en"],"chinese_lexicalizations":zh,"lane":lane,"editorial_disposition":old.get("editorial_disposition") if old else None,"source":"V109 OMW-cmn CILI OEWN2025 exact synset","needs_independent_examples":True,"semantic_certified":False,"production_ready":False})
 cards.sort(key=lambda r:(r["rank"],r["teaching_sense_id"]))
 outputs=[]
 for start in range(0,len(cards),a.batch_size):
  n=start//a.batch_size+1;path=out/f"batch_{n:03}.jsonl"
  block=cards[start:start+a.batch_size]
  path.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in block),encoding="utf-8")
  outputs.append({"path":path.name,"records":len(block),"sha256":hashlib.sha256(path.read_bytes()).hexdigest()})
 manifest={"schema":"enlex-batch-factory-v1","total":len(cards),"batch_size":a.batch_size,"batches":outputs,"already_triaged":len(reviewed),"new_semantic_reviews":0,"independent_certified":0,"production_ready":0,"lanes":dict(counts)}
 (out/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps(manifest,ensure_ascii=False,indent=2))
if __name__=="__main__":main()
