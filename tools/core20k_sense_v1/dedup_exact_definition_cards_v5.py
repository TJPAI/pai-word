#!/usr/bin/env python3
"""Make conservative, evidence-based *automatic* redundant-card decisions.
Only exact same lexical headword + POS + definition duplicates may be collapsed in the
teaching VIEW. Never delete original OEWN Sense, never mark semantic equivalence certified.
"""
import pathlib,json,collections,time,re
start=time.monotonic()
candidates=list(pathlib.Path(".").rglob("sense_selection_v3_decisions_batch001.jsonl"))
assert len(candidates)==1,candidates
base=candidates[0].parent
counts=collections.Counter();groups=[];protected=0;seen=0
for b in range(1,41):
    records=[json.loads(x) for x in (base/f"sense_selection_v3_decisions_batch{b:03d}.jsonl").open(encoding="utf8")]
    byword=collections.defaultdict(list)
    for d in records:byword[d["rank"]].append(d);seen+=1
    for rank,items in byword.items():
        definition_groups=collections.defaultdict(list)
        for x in items:
            key=(" ".join(x["source_definition"].casefold().split()))
            definition_groups[key].append(x)
        for definition,members in definition_groups.items():
            if len(members)<2:continue
            # Exact definition alone is not enough for meaning merging: queue display dedup only.
            canonical=sorted(members,key=lambda x:x["external_sense_id"])[0]
            groups.append({"rank":rank,"lemma":canonical["lemma"],
               "canonical_display_sense_id":canonical["external_sense_id"],
               "other_source_sense_ids":[x["external_sense_id"] for x in members if x is not canonical],
               "definition_en":canonical["source_definition"],
               "action":"COLLAPSE_EXACT_DUPLICATE_DEFINITION_CARDS_ONLY",
               "source_senses_preserved":True,"semantic_merged":False,
               "ku_archival_action":"NONE","production_ready":False})
            counts["redundant_definition_cards"]+=len(members)-1
            counts["display_groups"]+=1
assert seen==60204
p=base/"sense_selection_v5_exact_card_dedup.jsonl"
p.write_text("".join(json.dumps(x,ensure_ascii=False)+"\n" for x in groups),encoding="utf8")
elapsed=time.monotonic()-start
report={"source_senses_processed":seen,"duplicate_display_groups":counts["display_groups"],
"redundant_definition_cards_to_hide_in_learning_view":counts["redundant_definition_cards"],
"source_senses_deleted":0,"semantic_sense_merges_certified":0,
"usable_view_card_decisions":counts["redundant_definition_cards"],
"runtime_seconds":round(elapsed,3),
"view_decisions_per_second":round(counts["redundant_definition_cards"]/max(elapsed,0.001),2),
"limitation":"Exact identical definition cards only; no claim that OEWN senses are semantically identical."}
(base/"sense_selection_v5_efficiency.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("SENSE_SELECTION_V5_EXACT_CARD_DEDUP_PASS",json.dumps(report))
