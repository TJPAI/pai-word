#!/usr/bin/env python3
"""Match frozen Core20K missing Sense against local licensed OEWN 2025 XML.
Outputs candidates only, NEVER Production Ready. Full reference implementation:
core20k_batch10_oewn_matching.zip (audited local artifact).
"""
import argparse,gzip,json,hashlib,collections,pathlib
from lxml import etree
p=argparse.ArgumentParser()
for n in ("mvp","oewn","out"): p.add_argument("--"+n,required=True)
a=p.parse_args();out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
with gzip.open(a.mvp,"rt",encoding="utf-8") as f: entries=json.load(f)["entries"]
missing={e["lemma"].casefold():e for e in entries if e["legacy_rank"] is None and not e["senses"]}
lookup=collections.defaultdict(list);syn={}
with gzip.open(a.oewn,"rb") as f:
 for _,el in etree.iterparse(f,events=("end",),tag=("{*}LexicalEntry","{*}Synset")):
  if etree.QName(el).localname=="LexicalEntry":
   lemma=el.find("{*}Lemma")
   if lemma is not None and (lemma.get("writtenForm") or "").casefold() in missing:
    for s in el.findall("{*}Sense"):
     lookup[lemma.get("writtenForm").casefold()].append({"sense_id":s.get("id"),"synset":s.get("synset"),"pos":lemma.get("partOfSpeech")})
  else:
   syn[el.get("id")]=[x.text for x in el.findall("{*}Definition") if x.text]
  el.clear()
matched=0;total=0
with (out/"oewn_candidates.jsonl").open("w") as f, (out/"unmatched.jsonl").open("w") as g:
 for lemma,e in sorted(missing.items(),key=lambda kv:kv[1]["rank"]):
  options=[dict(s,definition_en=syn[s["synset"]][0]) for s in lookup[lemma] if syn.get(s["synset"])]
  rec={"rank":e["rank"],"lemma":e["lemma"]}
  if options:
   matched+=1;total+=len(options)
   f.write(json.dumps(dict(rec,candidates=options,status="OEWN_CANDIDATE_UNVERIFIED"))+"\n")
  else:g.write(json.dumps(rec)+"\n")
report={"missing_input":len(missing),"matched":matched,"unmatched":len(missing)-matched,"candidate_senses":total,"production_ready":0,"oewn_sha256":hashlib.sha256(pathlib.Path(a.oewn).read_bytes()).hexdigest()}
(out/"audit.json").write_text(json.dumps(report,indent=2)+"\n")
assert len(missing)==3605 and matched==3078 and total==8395,report
print(json.dumps(report))
