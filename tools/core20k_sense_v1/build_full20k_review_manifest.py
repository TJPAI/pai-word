#!/usr/bin/env python3
"""Full Core20K review planning: source-independent risk, source counts, safe review bundles.
All results are provisional, no semantic merge or certification.
"""
import json,pathlib,collections
p=pathlib.Path("tools/core20k_sense_v1/reports/source_join")
source=p/"full20k_sense_preclusters.jsonl"
counts=collections.Counter();bands=collections.defaultdict(list)
with source.open(encoding="utf8") as inp, (p/"full20k_review_manifest.jsonl").open("w",encoding="utf8") as out:
 for line in inp:
  w=json.loads(line);n=len(w["gloss_clusters"])
  if n==0:lane="P0_MISSING_DEFINITION"
  elif n>18:lane="P1_HIGH_POLYSEMY"
  elif w["source_count"]<2:lane="P2_WEAK_SOURCE"
  else:lane="P3_REGULAR"
  # Separate a lexicon word-level coverage check from genuine sense-level agreement.
  multi_sense_support=sum(len(set(ref["source"] for ref in x["source_refs"]))>=2 for x in w["gloss_clusters"])
  rec={"rank":w["rank"],"lemma":w["lemma"],"lane":lane,"candidate_count":n,
       "exact_gloss_cross_source_matches":multi_sense_support,
       "source_count":w["source_count"],"has_chinese_evidence":bool(w["zh_evidence"]),
       "batch":(w["rank"]-1)//500+1,"review_status":"NEEDS_SEMANTIC_ADJUDICATION",
       "release_eligible":False}
  out.write(json.dumps(rec,ensure_ascii=False)+"\n")
  bands[lane].append((w["rank"],w["lemma"],n))
  counts["words"]+=1;counts["glosses"]+=n
  counts["exact_cross_source_glosses"]+=multi_sense_support
  counts["words_without_zh"]+=not bool(w["zh_evidence"])
assert counts["words"]==20000
report={"overall":dict(counts),"lanes":{k:len(v) for k,v in bands.items()},
        "highest_polysemy_examples":sorted(bands["P1_HIGH_POLYSEMY"],key=lambda x:-x[2])[:20],
        "missing_definition_words":bands["P0_MISSING_DEFINITION"],
        "method":"Source-level exact normalized gloss crosscheck, not semantic equivalence",
        "certified":0}
(p/"full20k_review_manifest_summary.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("FULL20K_REVIEW_MANIFEST",json.dumps(report,ensure_ascii=False))
