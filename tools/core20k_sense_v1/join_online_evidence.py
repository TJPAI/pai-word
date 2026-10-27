#!/usr/bin/env python3
import gzip,json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
with gzip.open("data/core20k-runtime.json.gz","rt",encoding="utf8") as f: rows=json.load(f)["headwords"]
byrank={w[0]:w for w in rows}; assert len(byrank)==20000 and set(byrank)==set(range(1,20001))
sourcepaths={
 "oewn2025":p/"oewn"/"oewn2025_full20k_sense_candidates.jsonl",
 "ecdict":p/"ecdict"/"ecdict_core20k.jsonl",
 "zhwiktionary":p/"zh"/"zhwiktionary_core20k.jsonl",
 "kaikki_en":p/"kaikki"/"kaikki_en_core20k.jsonl"
}
signals={r:set() for r in byrank};counts=collections.Counter();sourceitems={}
for name,path in sourcepaths.items():
 assert path.exists(),path
 distinct=set();total=0;meaningful=0
 for line in path.open(encoding="utf8"):
  row=json.loads(line);rank=row["rank"]
  assert byrank[rank][1].casefold()==row["lemma"].casefold(),(name,rank)
  total+=1;distinct.add(rank)
  if name=="oewn2025":evidence=bool(row.get("oewn_candidates"))
  elif name=="kaikki_en":evidence=bool(row.get("senses"))
  elif name=="ecdict":evidence=bool(str(row.get("definition_en") or "").strip() or str(row.get("translation_zh") or "").strip())
  else:evidence=bool(row.get("senses"))
  if evidence:signals[rank].add(name);meaningful+=1
 sourceitems[name]={"records":total,"headwords_with_any_record":len(distinct),"records_with_meaning_content":meaningful}
out=p/"joined_coverage_20000.jsonl";summary=collections.Counter()
with out.open("w",encoding="utf8") as f:
 for rank,w in sorted(byrank.items()):
  ku=w[4];runtime=any(isinstance(z,list) and len(z)>1 and z[1]=="sense" for z in ku)
  flags=sorted(signals[rank]);summary["source_count_"+str(len(flags))]+=1
  if not flags and not runtime:summary["no_source_or_runtime"]+=1
  if flags and not runtime:summary["external_only"]+=1
  f.write(json.dumps({"rank":rank,"lemma":w[1],"has_runtime_sense_ku":runtime,"external_sources":flags,"status":"EVIDENCE_COVERAGE_ONLY_NOT_CERTIFIED"},ensure_ascii=False)+"\n")
report={"source_files":sourceitems,"coverage_stats":dict(summary),"source_count_unique":{name:sum(name in x for x in signals.values()) for name in sourcepaths},"frozen":20000,"certified":0,"warning":"Coverage of definitions is not verified sense accuracy, bilingual agreement or complete polysemy"}
(p/"joined_coverage_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("MULTISOURCE_COVERAGE",json.dumps(report,ensure_ascii=False))
