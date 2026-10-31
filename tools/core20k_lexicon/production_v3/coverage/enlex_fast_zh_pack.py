#!/usr/bin/env python3
"""Build actual source-backed Chinese Sense draft pack, favor existing edits.
No certification workflow. Ambiguous terms remain a list, not fabricated gloss.
"""
import json,pathlib,collections,hashlib,re
R=pathlib.Path("tools/core20k_lexicon/production_v3/coverage")
src=[]
for p in sorted((R/"omw_zh_gap_persistence").glob("candidates_*.jsonl")):
 src.extend(json.loads(line) for line in p.read_text(encoding="utf-8").splitlines() if line.strip())
assert len(src)==7302 and len({r['teaching_sense_id'] for r in src})==7302
edits={}
paths=sorted(R.glob("omw_single_lexeme_editorial_0??.jsonl"))+[R/"omw_multi_13_high_ambiguity_editorial_001.jsonl",R/"omw_multi188_editorial_008_hold.jsonl"]
for p in paths:
 for line in p.read_text(encoding="utf-8").splitlines():
  if not line.strip(): continue
  r=json.loads(line);ident=r["teaching_sense_id"]
  assert ident not in edits,("editorial duplicate",ident,str(p))
  edits[ident]=(r,p.name)
assert len(edits)==764
source={r["teaching_sense_id"]:r for r in src}
assert set(edits)<=set(source),("orphan edit",len(set(edits)-set(source)))
def clean(s):
 if not isinstance(s,str): return None
 s=s.strip()
 # OMW Chinese lexical suffix markup: '+的' is an inflection label, not display text.
 s=s.replace("+的","的").replace("+地","地").replace("+者","者")
 return s if s and len(s)<=35 and not any(t in s for t in ("+","*","/","=","<",">","|","{","}","@","[","]")) else None
out=[]
stats=collections.Counter()
for r in src:
 sid=r["teaching_sense_id"];zh=sorted(set(x for z in r["chinese_lexicalizations"] if (x:=clean(z))),key=lambda x:(len(x),x))
 ed=edits.get(sid)
 if ed:
  item,p=ed
  proposed=item.get("gloss_zh_revised_candidate")
  if not proposed: 
   chosen=None;status="AMBIGUOUS"
  else:
   chosen=proposed;status="EDITORIAL_DRAFT"
 else:
  chosen=zh[0] if zh else None
  status=("SINGLE_SOURCE_DRAFT" if len(zh)==1 else
          "MULTI_SOURCE_PROVISIONAL" if len(zh)>1 else "NO_VALID_SOURCE_GLOSS")
 stats[status]+=1
 out.append({"teaching_sense_id":sid,"rank":r["rank"],"lemma":r["lemma"],"synset_id":r["synset_id"],"definition_en":r["definition_en"],
 "gloss_zh":chosen,"gloss_zh_status":status,"alternate_zh":zh,"editorial_source":ed[1] if ed else None,"source":"OMW-cmn/OEWN exact synset", "production_ready":False,"display_draft_usable":bool(chosen),"needs_semantic_review":status=="MULTI_SOURCE_PROVISIONAL"})
dst=R/"fast_zh_pack_v1";dst.mkdir(parents=True,exist_ok=True)
# stream 1000 per shard to keep GitHub readable
sha={}
for i in range(0,len(out),1000):
 p=dst/f"zh_sense_{i//1000+1:03d}.jsonl";p.write_text("".join(json.dumps(x,ensure_ascii=False)+chr(10) for x in out[i:i+1000]),encoding="utf8");sha[p.name]=hashlib.sha256(p.read_bytes()).hexdigest()
m={"total_source_senses":len(out),"edited_input":len(edits),"counts":dict(stats),"gloss_available":sum(x["gloss_zh"] is not None for x in out),"provisional_multi":stats["MULTI_SOURCE_PROVISIONAL"],"unique_ids":len({r["teaching_sense_id"] for r in out}),"shard_sha256":sha,"provenance":"OMW lexical evidence; automatic multilexeme first-option selection is provisional and not semantic disambiguation"}
(dst/"manifest.json").write_text(json.dumps(m,ensure_ascii=False,indent=2)+chr(10),encoding="utf8")
print(json.dumps(m,ensure_ascii=False))
