#!/usr/bin/env python3
"""Read-only Core20K 20K/1676 coverage audit. No certification claim."""
import collections,gzip,hashlib,json,pathlib
root=pathlib.Path(__file__).resolve().parents[4]
runtime=root/"core20k-test/data/core20k-runtime.json.gz"
shards=root/"tools/core20k_lexicon/production_v3/editorial/v179_persistence/shards"
out=root/"tools/core20k_lexicon/production_v3/coverage/v218_output"
out.mkdir(parents=True,exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def save(name,records):
 p=out/name
 p.write_text("".join(json.dumps(x,ensure_ascii=False,sort_keys=True)+"\n" for x in records))
 return {"rows":len(records),"sha256":sha(p.read_bytes())}
raw=runtime.read_bytes()
obj=json.loads(gzip.decompress(raw))
if isinstance(obj,dict):
 a=next((obj[k] for k in ("words","headwords","entries","items","data","lexicon") if isinstance(obj.get(k),list)),None)
else:a=obj
assert isinstance(a,list), "Unexpected runtime schema"
words=[]
for item in a:
 if isinstance(item,list):rank,lemma,pos=item[:3]
 elif isinstance(item,dict):
  rank=item.get("rank");lemma=item.get("lemma") or item.get("headword");pos=item.get("pos","")
 else:raise ValueError("Unknown runtime row type")
 words.append({"rank":int(rank),"lemma":str(lemma),"pos":str(pos)})
assert len(words)==20000
assert {w["rank"] for w in words}==set(range(1,20001))
assert len({w["lemma"].casefold() for w in words})==20000
by_rank={x["rank"]:x for x in words}
senses=[]
for p in sorted(shards.glob("senses_*.jsonl")):
 senses.extend(json.loads(line) for line in p.read_text().splitlines() if line.strip())
assert len(senses)==1676 and len({s["sense_key"] for s in senses})==1676
matches=collections.defaultdict(list);bad=[]
for s in senses:
 r=int(s["rank"]);w=by_rank.get(r)
 if w is None or s["lemma"].casefold()!=w["lemma"].casefold():
  bad.append({"sense_key":s["sense_key"],"rank":r,"sense_lemma":s["lemma"],"runtime_lemma":w["lemma"] if w else None})
 else:matches[r].append(s)
assert not bad, f"Rank/lemma mismatch: {bad[:5]}"
ledger=[]
for w in words:
 found=matches.get(w["rank"],[])
 ledger.append({**w,"verified_priority_sense_keys":[x["sense_key"] for x in found],
  "verified_priority_sense_count":len(found),"other_sense_sources_not_audited":True,
  "source_certified":False,"teaching_ready_not_established":True})
batches=[]
for start in range(1,20001,500):
 chunk=ledger[start-1:start+499]
 present=sum(bool(x["verified_priority_sense_count"]) for x in chunk)
 batches.append({"rank_start":start,"rank_end":start+499,"headwords":500,
  "priority_pool_sense_headwords":present,"outside_this_priority_pool":500-present,
  "next_step":"CROSS_SOURCE_SENSE_JOIN_AND_QA"})
files={"coverage_20000.jsonl":save("coverage_20000.jsonl",ledger),
 "batch_queue_40.jsonl":save("batch_queue_40.jsonl",batches),
 "outside_priority_pool_18324.jsonl":save("outside_priority_pool_18324.jsonl",[x for x in ledger if not x["verified_priority_sense_count"]]),
 "identity_errors.jsonl":save("identity_errors.jsonl",bad)}
report={"version":"V218","runtime_words":len(words),"runtime_sha256":sha(raw),
 "priority_pool_senses":len(senses),"priority_pool_headwords":len(matches),
 "outside_priority_pool":20000-len(matches),"identity_errors":len(bad),
 "independently_certified":0,"production_ready":0,
 "batches":40,"batch_size":500,"files":files,
 "scope_warning":"This is coverage of the verified V179 1676-sense pool, NOT all existing Sense/KU candidates."}
(out/"manifest.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")
print(json.dumps(report,indent=2,ensure_ascii=False))
